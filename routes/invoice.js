const express = require("express");
const { check,body } = require("express-validator");

const router = express.Router();

const invoiceControllers = require("../controllers/invoice");

// fetch all invoices
router.get("/invoices", invoiceControllers.getAllInvoices);

//create a new invoice
router.post("/generate/invoice", 
            [
                check("email")
                .isEmail()
                .withMessage("Please provide a valid email")
                .normalizeEmail()
                .toLowerCase(),
            ]
            ,invoiceControllers.generateInvoice);

//fetch late invoices
router.get("/invoices/late", invoiceControllers.getLateInvoices);

//fetch paid invoices
router.get("/invoices/paid", invoiceControllers.getPaidInvoices);

//fetch a invoice
router.get("/invoices/:invoiceId", invoiceControllers.getInvoice);

//updating the status of invoice
router.put("/invoices/:invoiceId/change-status", invoiceControllers.updateInvoiceStatus);

module.exports = router;