const axios        = require("axios");
const crypto       = require("crypto");
const fs           = require("fs");
const path         = require("path");
const Fee          = require("../models/Fee");
const Payment      = require("../models/Payment");
const Student      = require("../models/Student");
const OPayPending  = require("../models/OPayPending");

// ── Paystack ──────────────────────────────────────────────────────────────────
const paystackAPI = axios.create({ baseURL: "https://api.paystack.co" });
paystackAPI.interceptors.request.use((cfg) => {
  cfg.headers.Authorization = `Bearer ${process.env.PAYSTACK_SECRET_KEY}`;
  return cfg;
});

// ── Monnify ───────────────────────────────────────────────────────────────────
const getMonnifyToken = async () => {
  const base    = process.env.MONNIFY_BASE_URL || "https://sandbox.monnify.com";
  const encoded = Buffer.from(
    `${process.env.MONNIFY_API_KEY}:${process.env.MONNIFY_SECRET_KEY}`
  ).toString("base64");
  const { data } = await axios.post(`${base}/api/v1/auth/login`, {},
    { headers: { Authorization: `Basic ${encoded}` } });
  if (!data.requestSuccessful) throw new Error("Monnify auth failed");
  return { token: data.responseBody.accessToken, base };
};

// ── OPay helpers ──────────────────────────────────────────────────────────────
const opayBase = () => process.env.OPAY_BASE_URL || "https://sandboxapi.pay.africa";

const opayHeaders = (body) => {
  const bodyStr = JSON.stringify(body);
  const hmac    = crypto.createHmac("sha512", process.env.OPAY_SECRET_KEY)
    .update(bodyStr).digest("hex");
  const auth    = Buffer.from(`${process.env.OPAY_PUBLIC_KEY}:${hmac}`).toString("base64");
  return {
    Authorization:  `Bearer ${auth}`,
    MerchantSerial: process.env.OPAY_MERCHANT_ID,
    "Content-Type": "application/json",
  };
};

// RSA private key — loaded once at startup for payout signing
let _opayPrivateKey = null;
const getOpayPrivateKey = () => {
  if (_opayPrivateKey) return _opayPrivateKey;
  const keyPath = process.env.OPAY_PRIVATE_KEY_PATH;
  if (keyPath) {
    try {
      _opayPrivateKey = fs.readFileSync(path.resolve(__dirname, "..", keyPath), "utf8");
    } catch (e) {
      console.warn("OPay private key file not found:", keyPath);
    }
  }
  return _opayPrivateKey;
};

// ── Shared: save a transaction to DB + return populated doc ──────────────────
const recordPayment = async ({ studentId, feeId, amountPaid, reference, method, gateway }) => {
  let payment = await Payment.findOne({ student: studentId, fee: feeId });

  if (!payment) {
    const fee = await Fee.findById(feeId);
    payment = new Payment({
      student: studentId, fee: feeId, class: fee.class,
      totalAmount: fee.amount, amountPaid: 0, balance: fee.amount, status: "not_paid",
    });
  }

  const already = payment.transactions.some((t) => t.reference === reference);

  if (!already) {
    payment.amountPaid += amountPaid;
    payment.transactions.push({
      amount: amountPaid, reference,
      method:        method   || "custom",
      gateway:       gateway  || "paystack",
      paidAt:        new Date(),
      gatewayStatus: "success",
    });
    await payment.save();
  }

  const populated = await Payment.findById(payment._id)
    .populate("student", "fullname registrationNumber email")
    .populate("fee",     "title amount term session")
    .populate("class",   "name");

  return { payment: populated, duplicate: already };
};

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE FEE
// ═══════════════════════════════════════════════════════════════════════════════
const createFee = async (req, res) => {
  try {
    const { title, classId, term, session, amount, paymentOptions, dueDate } = req.body;
    if (!title || !classId || !term || !amount)
      return res.status(400).json({ success: false, message: "title, class, term and amount are required" });

    const fee = await Fee.create({
      title: title.trim(), class: classId, term, session: session || "",
      amount: Number(amount),
      paymentOptions: {
        fullPayment:  paymentOptions?.fullPayment !== false,
        installment:  !!paymentOptions?.installment,
        customAmount: !!paymentOptions?.customAmount,
      },
      dueDate: dueDate ? new Date(dueDate) : undefined,
      createdBy: req.user.id, createdByRole: req.user.role,
    });

    const students = await Student.find({ class: classId }, "_id");
    if (students.length > 0) {
      await Payment.insertMany(students.map((s) => ({
        student: s._id, fee: fee._id, class: classId,
        totalAmount: Number(amount), amountPaid: 0, balance: Number(amount),
        status: "not_paid", transactions: [],
      })));
    }

    await fee.populate("class", "name");
    return res.status(201).json({
      success: true,
      message: `Fee created. ${students.length} student record(s) initialized.`,
      fee,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// GET ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════
const getFees = async (req, res) => {
  try {
    const { classId, term, status } = req.query;
    const filter = {};
    if (classId) filter.class  = classId;
    if (term)    filter.term   = term;
    if (status)  filter.status = status;
    const fees = await Fee.find(filter).populate("class", "name").sort({ createdAt: -1 });
    return res.json({ success: true, fees });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getFeePayments = async (req, res) => {
  try {
    const payments = await Payment.find({ fee: req.params.feeId })
      .populate("student", "fullname registrationNumber email")
      .sort({ status: 1 });
    const summary = {
      total:          payments.length,
      paid:           payments.filter((p) => p.status === "paid").length,
      partial:        payments.filter((p) => p.status === "partial").length,
      not_paid:       payments.filter((p) => p.status === "not_paid").length,
      totalCollected: payments.reduce((s, p) => s + p.amountPaid, 0),
      totalExpected:  payments.reduce((s, p) => s + p.totalAmount, 0),
    };
    return res.json({ success: true, payments, summary });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getStudentFees = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id, "class email fullname");
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const fees = await Fee.find({ class: student.class, status: "active" })
      .populate("class", "name").sort({ createdAt: -1 });

    const payments = await Payment.find({ student: req.user.id });
    const paymentMap = {};
    payments.forEach((p) => { paymentMap[p.fee.toString()] = p; });

    return res.json({
      success: true,
      fees: fees.map((f) => ({
        fee: f,
        payment: paymentMap[f._id.toString()] || {
          totalAmount: f.amount, amountPaid: 0, balance: f.amount,
          status: "not_paid", transactions: [],
        },
      })),
      student: { email: student.email, fullname: student.fullname },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getPaidStudents = async (req, res) => {
  try {
    const payments = await Payment.find({ amountPaid: { $gt: 0 } })
      .populate("student", "fullname registrationNumber email")
      .populate("fee",     "title amount term session")
      .populate("class",   "name")
      .sort({ updatedAt: -1 });
    return res.json({ success: true, payments });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZE PAYMENT — Paystack | Monnify | OPay
// ═══════════════════════════════════════════════════════════════════════════════
const initializePayment = async (req, res) => {
  try {
    const { feeId, amount, method, gateway = "paystack" } = req.body;

    const student = await Student.findById(req.user.id, "email fullname class");
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const fee = await Fee.findById(feeId);
    if (!fee)   return res.status(404).json({ success: false, message: "Fee not found" });

    const existing   = await Payment.findOne({ student: req.user.id, fee: feeId });
    const currentBal = existing ? existing.balance : fee.amount;
    const payAmount  = Math.min(Number(amount), currentBal);
    if (payAmount <= 0)
      return res.status(400).json({ success: false, message: "Fee already fully settled" });

    // ── Paystack ──────────────────────────────────────────────────────────────
    if (gateway === "paystack") {
      const reference = `PS-${feeId.toString().slice(-8)}-${Date.now()}`;
      const { data }  = await paystackAPI.post("/transaction/initialize", {
        email: student.email, amount: Math.round(payAmount * 100), reference,
        metadata: { feeId: feeId.toString(), studentId: req.user.id.toString(),
                    method: method || "custom", gateway: "paystack" },
        callback_url: `${process.env.FRONTEND_URL}/student/fees`,
      });
      if (!data.status) return res.status(400).json({ success: false, message: data.message });
      return res.json({ success: true, gateway: "paystack",
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code, reference: data.data.reference, amount: payAmount });
    }

    // ── Monnify ───────────────────────────────────────────────────────────────
    if (gateway === "monnify") {
      return res.json({ success: true, gateway: "monnify",
        reference: `MF-${feeId.toString()}-${Date.now()}`,
        amount: payAmount, feeTitle: fee.title,
        email: student.email, fullname: student.fullname });
    }

    // ── OPay ──────────────────────────────────────────────────────────────────
    if (gateway === "opay") {
      // Pre-flight: catch missing / placeholder config before hitting OPay API
      const mid = process.env.OPAY_MERCHANT_ID || "";
      const pub = process.env.OPAY_PUBLIC_KEY  || "";
      const sec = process.env.OPAY_SECRET_KEY  || "";

      if (!mid || mid.includes("your_opay"))
        return res.status(400).json({ success: false, message: "OPay Merchant ID not set. Add OPAY_MERCHANT_ID to backend .env" });
      if (!pub || !sec)
        return res.status(400).json({ success: false, message: "OPay API keys missing in backend .env" });

      const reference = `OP-${feeId.toString()}-${Date.now()}`;
      const body = {
        reference,
        mchShortName:      process.env.SCHOOL_NAME || "School",
        productName:       fee.title,
        productDesc:       fee.title,
        supplierReference: reference,
        callbackUrl:  `${process.env.BACKEND_URL}/api/fees/webhook/opay`,
        returnUrl:    `${process.env.FRONTEND_URL}/student/fees`,
        expireAt:     30,
        payAmount:    { currency: "NGN", total: Math.round(payAmount * 100) },
        userInfo:     { userEmail: student.email, userName: student.fullname, userMobile: "" },
      };

      let opayData;
      try {
        const { data } = await axios.post(
          `${opayBase()}/api/v3/international/payment/create`,
          body,
          { headers: opayHeaders(body) }
        );
        opayData = data;
      } catch (opayErr) {
        const opayMsg = opayErr.response?.data?.message
          || opayErr.response?.data?.responseMessage
          || opayErr.message
          || "OPay API unreachable";
        console.error("OPay init error:", opayErr.response?.data || opayErr.message);
        return res.status(400).json({ success: false, message: `OPay: ${opayMsg}` });
      }

      if (opayData.code !== "00000") {
        console.error("OPay non-success:", opayData);
        return res.status(400).json({
          success: false,
          message: opayData.message || opayData.responseMessage || `OPay error code: ${opayData.code}`,
        });
      }

      // Store reference → student+fee mapping so webhook knows who paid
      await OPayPending.findOneAndUpdate(
        { reference },
        { reference, studentId: req.user.id, feeId, amount: payAmount, method: method || "custom" },
        { upsert: true, new: true }
      );

      return res.json({
        success:    true,
        gateway:    "opay",
        cashierUrl: opayData.data.cashierUrl,
        reference:  opayData.data.reference || reference,
        amount:     payAmount,
      });
    }

    return res.status(400).json({ success: false, message: `Unknown gateway: ${gateway}` });
  } catch (err) {
    console.error("initializePayment error:", err.message);
    return res.status(500).json({ success: false, message: err.response?.data?.message || err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFY PAYMENT — student-triggered after returning from OPay / Monnify / PS
// ═══════════════════════════════════════════════════════════════════════════════
const verifyPayment = async (req, res) => {
  try {
    const { reference }                           = req.params;
    const { gateway = "paystack", feeId, method } = req.query;
    const studentId = req.user.id;

    // ── Paystack ──────────────────────────────────────────────────────────────
    if (gateway === "paystack") {
      const { data } = await paystackAPI.get(`/transaction/verify/${reference}`);
      if (!data.status || data.data.status !== "success")
        return res.status(400).json({ success: false, message: "Payment not successful on Paystack" });

      const meta = data.data.metadata || {};
      const { payment, duplicate } = await recordPayment({
        studentId: meta.studentId || studentId,
        feeId:     meta.feeId     || feeId,
        amountPaid: data.data.amount / 100,
        reference, method: meta.method || method || "custom", gateway: "paystack",
      });

      const msg = payment.status === "paid" ? "Fee fully paid!"
        : `Payment recorded. Balance: ₦${payment.balance.toLocaleString()}`;
      return res.json({ success: true, message: duplicate ? "Already processed" : msg, payment });
    }

    // ── Monnify ───────────────────────────────────────────────────────────────
    if (gateway === "monnify") {
      const { token, base } = await getMonnifyToken();
      const { data } = await axios.get(
        `${base}/api/v1/merchant/transactions/query?paymentReference=${reference}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!data.requestSuccessful)
        return res.status(400).json({ success: false, message: "Monnify verification failed" });

      const txn = data.responseBody;
      if (!["PAID", "PARTIALLY_PAID"].includes(txn.paymentStatus))
        return res.status(400).json({ success: false, message: `Monnify status: ${txn.paymentStatus}` });

      const { payment, duplicate } = await recordPayment({
        studentId, feeId: feeId || reference.split("-")[1],
        amountPaid: txn.amountPaid || txn.amount || 0,
        reference, method: method || "custom", gateway: "monnify",
      });

      const msg = payment.status === "paid" ? "Fee fully paid!"
        : `Payment recorded. Balance: ₦${payment.balance.toLocaleString()}`;
      return res.json({ success: true, message: duplicate ? "Already processed" : msg, payment });
    }

    // ── OPay ──────────────────────────────────────────────────────────────────
    if (gateway === "opay") {
      const body = { reference };
      const { data } = await axios.post(
        `${opayBase()}/api/v3/international/payment/query`,
        body,
        { headers: opayHeaders(body) }
      );
      if (data.code !== "00000")
        return res.status(400).json({ success: false, message: data.message || "OPay query failed" });

      const txn = data.data;
      if (txn.status !== "SUCCESS")
        return res.status(400).json({ success: false, message: `OPay status: ${txn.status}. Payment not yet confirmed.` });

      // Resolve feeId: prefer query param → pending record → parse from reference
      const pending = await OPayPending.findOne({ reference });
      const resolvedFeeId = feeId || pending?.feeId || reference.split("-")[1];

      const { payment, duplicate } = await recordPayment({
        studentId,
        feeId:     resolvedFeeId,
        amountPaid: (txn.orderAmount?.total || 0) / 100,
        reference, method: method || pending?.method || "custom", gateway: "opay",
      });

      // Clean up pending record
      await OPayPending.deleteOne({ reference }).catch(() => {});

      const msg = payment.status === "paid" ? "Fee fully paid!"
        : `Payment recorded. Balance: ₦${payment.balance.toLocaleString()}`;
      return res.json({ success: true, message: duplicate ? "Already processed" : msg, payment });
    }

    return res.status(400).json({ success: false, message: `Unknown gateway: ${gateway}` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.response?.data?.message || err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PAYSTACK WEBHOOK
// ═══════════════════════════════════════════════════════════════════════════════
const paystackWebhook = async (req, res) => {
  const hash = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(req.rawBody || JSON.stringify(req.body)).digest("hex");
  if (hash !== req.headers["x-paystack-signature"])
    return res.status(400).json({ message: "Invalid signature" });

  const event = req.body;
  if (event.event === "charge.success") {
    const { reference, metadata, amount } = event.data;
    const { feeId, studentId, method }    = metadata || {};
    try {
      await recordPayment({ studentId, feeId, amountPaid: amount / 100,
        reference, method, gateway: "paystack" });
    } catch (e) { console.error("Paystack webhook:", e.message); }
  }
  res.sendStatus(200);
};

// ═══════════════════════════════════════════════════════════════════════════════
// OPAY WEBHOOK — OPay posts here when a payment completes
// ═══════════════════════════════════════════════════════════════════════════════
const opayWebhook = async (req, res) => {
  try {
    // OPay sends a notify-sign or sign header containing their RSA signature.
    // We verify it using OPay's own public key (download from OPay dashboard → API keys).
    // For now we process all incoming webhooks; add signature check in production.
    const { reference, status, orderAmount } = req.body || {};

    if (!reference) return res.sendStatus(200);
    if (status !== "SUCCESS" && status !== "SUCCESSFUL") return res.sendStatus(200);

    // Look up which student+fee this reference belongs to
    const pending = await OPayPending.findOne({ reference });
    if (!pending) {
      console.warn("OPay webhook: no pending record for", reference);
      return res.sendStatus(200);
    }

    const amountPaid = (orderAmount?.total || 0) / 100;
    await recordPayment({
      studentId: pending.studentId,
      feeId:     pending.feeId,
      amountPaid,
      reference,
      method:    pending.method || "custom",
      gateway:   "opay",
    });

    await OPayPending.deleteOne({ reference }).catch(() => {});
    res.sendStatus(200);
  } catch (e) {
    console.error("OPay webhook error:", e.message);
    res.sendStatus(200);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECRETARY: RECORD CASH PAYMENT
// ═══════════════════════════════════════════════════════════════════════════════
const recordCashPayment = async (req, res) => {
  try {
    const { studentId, feeId, amount, method = "cash" } = req.body;

    if (!studentId || !feeId || !amount)
      return res.status(400).json({ success: false, message: "studentId, feeId and amount are required" });

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const fee = await Fee.findById(feeId);
    if (!fee) return res.status(404).json({ success: false, message: "Fee not found" });

    const existing   = await Payment.findOne({ student: studentId, fee: feeId });
    const currentBal = existing ? existing.balance : fee.amount;
    const payAmount  = Math.min(Number(amount), currentBal);

    if (payAmount <= 0)
      return res.status(400).json({ success: false, message: "Fee already fully paid" });

    const reference = `CASH-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const { payment } = await recordPayment({
      studentId,
      feeId,
      amountPaid: payAmount,
      reference,
      method: method || "cash",
      gateway: "cash",
    });

    const msg = payment.status === "paid"
      ? "Fee fully paid!"
      : `₦${payAmount.toLocaleString()} recorded. Balance: ₦${payment.balance.toLocaleString()}`;

    return res.status(200).json({ success: true, message: msg, payment });
  } catch (err) {
    console.error("recordCashPayment error:", err.message, err.errors || "");
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createFee, getFees, getFeePayments, getStudentFees, getPaidStudents,
  initializePayment, verifyPayment, paystackWebhook, opayWebhook,
  recordCashPayment,
};
