require("dotenv").config();
const cron = require("node-cron");
const express = require("express");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const mongoose = require("mongoose");

const Invoice = require("./models/invoice");
const invoiceRoutes = require("./routes/invoice");
const res = require("express/lib/response");
const invoice = require("./models/invoice");

const port = process.env.PORT;
const mongo_url = process.env.mongo_uri;
const user = process.env.user;
const clientId = process.env.clientId;
const clientSecret = process.env.clientSecret;
const refreshToken = process.env.refreshToken;
const OAuth2_client = new OAuth2( clientId, clientSecret);
OAuth2_client.setCredentials({
    refresh_token: refreshToken,
});

const app = express();

app.use(express.json());

//this helps in cross platform communication to avoid CORS error
app.use((req, res, next) =>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type , Authorization');
    next();
});

app.use("/api",invoiceRoutes);

//error handling middleware
app.use((error, req, res, next) =>{
    console.log(error);
    const status = error.statusCode || 500;
    const msg = error.message;
    res.status(status).json({message : msg});
});

//Checking the database for invoice status every 23 hours a day to send alerts regarding the deadline of invoice to respective email
cron.schedule('*/59 */23 * * *', () => {
    // console.log("cron is running");
    const DateNow = new Date();
    Invoice.find({dueDate: { $lt : DateNow.getTime()} })
            .select('status').equals('outstanding')
            .then( invoices =>{
                for(let invoice of invoices)
                {
                    invoice.status = "late";
                    invoice.save()
                            .then( result =>{
                                const accessToken = OAuth2_client.getAccessToken();
                                const transport = nodemailer.createTransport({
                                    service:"gmail",
                                    auth: {
                                        type:"OAuth2",
                                        user:user,
                                        clientId:clientId,
                                        clientSecret:clientSecret,
                                        refreshToken: refreshToken,
                                        accessToken:accessToken,
                                    },
                                    tls:{
                                        rejectUnauthorized:false,
                                    }
                                });
                                const emailBody = `
                                <h2> Invoice details </h2>
                                <p><b><u>Labour</u></b><br>Hours worked : ${result.labour.hours_Of_Work}<br>Cost Per Hour : ${result.labour.price_per_hour}</p>
                                <p><b><u>Materials Used</u></b><br> ${result.materialUsed}</p>
                                <p><b><u>Due Date</u></b><br> ${result.dueDate}</p>
                                <p><b><u>Notes</u></b><br> ${result.notes}</p>
                                <p><b><u>Status</u></b><br> ${result.status}</p>
                                `;
                                const mailOptions = {
                                    from: `"Its Srijit" <${user}>`, // sender address
                                    to: result.email, // list of receivers
                                    subject:"Only One Day Left To Pay Your Invoice ✔", // Subject line
                                    html: emailBody, // html body
                                };
                            
                                transport.sendMail(mailOptions , (err, result)=>{
                                    if(err)
                                    {
                                        console.log("Error :" ,   err);
                                        throw new Error(err);
                                    }
                                    else
                                    {
                                        console.log("Success :" , result);
                                    }
                                    transport.close();
                                });
                            });
                }

            })
            .catch(err =>{
                res.status(500).json({
                    error:err
                });
            })
    Invoice.find({dueDate: { $lt : DateNow.getTime()+(24*60*60*1000)} })
            .select('status').equals('outstanding')
            .then( invoices =>{
                for(let result of invoices)
                {
                    const accessToken = OAuth2_client.getAccessToken();
                    const transport = nodemailer.createTransport({
                        service:"gmail",
                        auth: {
                            type:"OAuth2",
                            user:user,
                            clientId:clientId,
                            clientSecret:clientSecret,
                            refreshToken: refreshToken,
                            accessToken:accessToken,
                        },
                        tls:{
                            rejectUnauthorized:false,
                        }
                    });
                    const emailBody = `
                    <h2> Invoice details </h2>
                    <p><b><u>Labour</u></b><br>Hours worked : ${result.labour.hours_Of_Work}<br>Cost Per Hour : ${result.labour.price_per_hour}</p>
                    <p><b><u>Materials Used</u></b><br> ${result.materialUsed}</p>
                    <p><b><u>Due Date</u></b><br> ${result.dueDate}</p>
                    <p><b><u>Notes</u></b><br> ${result.notes}</p>
                    <p><b><u>Status</u></b><br> ${result.status}</p>
                    `;
                    const mailOptions = {
                        from: `"Its Srijit" <${user}>`, // sender address
                        to: result.email, // list of receivers
                        subject:"Only One Day Left To Pay Your Invoice ✔", // Subject line
                        html: emailBody, // html body
                    };
                
                    transport.sendMail(mailOptions , (err, result)=>{
                        if(err)
                        {
                            console.log("Error :" ,   err);
                            throw new Error(err);
                        }
                        else
                        {
                            console.log("Success :" , result);
                        }
                        transport.close();
                    });
                }
            })
            .catch(err =>{
                res.status(500).json({
                    error:err
                });
            });
});

mongoose.connect( mongo_url )
        .then(result =>{
            console.log("database connected");
            console.log("listening to " + port);
            app.listen(port);
        })
        .catch(err => console.log(err));