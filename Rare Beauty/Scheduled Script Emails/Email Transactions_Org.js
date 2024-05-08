/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
const INVOICE_EURO = "113",
  INVOICE_GBP = "114",
  INVOICE_USD = "112",
  SALES_TEMPLATE = "115";

define(["N/search", "N/record", "N/render", "N/email", "N/file"], function (
  search,
  record,
  render,
  email,
  file
) {
  function execute(context) {
    try {
      var customers = getCustomersWithEmailContact(),
        invoices = searchInvoices(customers);
      log.debug("customers and transactions", customers + " " + invoices);
      //sales = searchSalesOrders(customers)
      sendEmails(invoices, "Invoice");
      //sendEmails(sales, 'Sales Order')
    } catch (e) {
      log.debug("Error", e.message);
    }
  }
  function sendEmails(transactions, type) {
    transactions.forEach(function (transaction) {
      var selectedTemplate = "",
        templateRenderer = render.create();
      var transactionLoad;
      if (type == "Invoice") {
        /*switch (transaction.currency) {
                    case "1":
                        selectedTemplate = INVOICE_USD;
                        break;
                    case "2":
                        selectedTemplate = INVOICE_GBP;
                        break;
                    case "4":
                        selectedTemplate = INVOICE_EURO;
                        break;
                    case "3":
                        selectedTemplate = INVOICE_USD;
                        break;
                    case "5":
                        selectedTemplate = INVOICE_EURO;
                        break;
                    default:
                        break;
                }*/
        selectedTemplate = searchTemplate(transaction.currency);
        try {
          transactionLoad = record.load({
            type: record.Type.INVOICE,
            id: transaction.id,
          });
        } catch (e) {
          log.debug("Error loading Invoice " + transaction.id);
          return;
        }
      } else {
        selectedTemplate = SALES_TEMPLATE;

        transactionLoad = record.load({
          type: record.Type.SALES_ORDER,
          id: transaction.id,
        });
      }
      if (selectedTemplate != "") {
        templateRenderer.addRecord({
          templateName: "record",
          record: transactionLoad,
        });

        templateRenderer.setTemplateById(selectedTemplate);
        log.debug(transaction.currency, templateRenderer.renderAsString());
        log.debug(
          "template",
          render.xmlToPdf(
            templateRenderer
              .renderAsString()
              .replace(/&/g, "&amp;")
              .replace(/&amp;nbsp;/g, "&nbsp;")
          )
        );
        var newFile = render.xmlToPdf(
          templateRenderer
            .renderAsString()
            .replace(/&/g, "&amp;")
            .replace(/&amp;nbsp;/g, "&nbsp;")
        );
        newFile.name = transaction.tranid + ".pdf";
        var recordObj = {
          entityId: parseInt(transaction.customer),
          transactionId: parseInt(transaction.id),
        };
        log.debug("test", JSON.stringify(recordObj));
        log.debug("tranid", transaction.id);
        try {
          if (getCustomerEmails(transaction.customer, type).length > 0) {
            email.send({
              author: getEmailAuthor(),
              recipients: getCustomerEmails(transaction.customer, type),
              subject: "Rare Beauty Brands: " + transaction.tranid,
              body:
                "Please open the attached file to view your " +
                type +
                ". To view the attachment, you first need the free Adobe Acrobat Reader. If you don't have it yet, visit Adobe's Web site http://www.adobe.com/products/acrobat/readstep.html to download it.",
              attachments: [newFile],
              relatedRecords: recordObj,
            });

            log.debug("Emails sent");
          }
          if (type == "Invoice") {
            record.submitFields({
              type: record.Type.INVOICE,
              id: transaction.id,
              values: {
                custbody_blk_inv_emailed: true,
              },
            });
          } else {
            record.submitFields({
              type: record.Type.SALES_ORDER,
              id: transaction.id,
              values: {
                custbody_blk_ack_sent: true,
              },
            });
          }
        } catch (e) {
          log.debug("Error loading Invoice " + transaction.id);
          return;
        }
      }
    });
  }
  function getCustomersWithEmailContact() {
    var customers = [];
    var customrecord_blk_email_contactSearchObj = search.create({
      type: "customrecord_blk_email_contact",
      filters: [],
      columns: [
        search.createColumn({
          name: "custrecord_ec_customer",
          summary: "GROUP",
          label: "Customer",
        }),
      ],
    });
    var searchResultCount = customrecord_blk_email_contactSearchObj.runPaged()
      .count;
    log.debug(
      "customrecord_blk_email_contactSearchObj result count",
      searchResultCount
    );
    customrecord_blk_email_contactSearchObj.run().each(function (result) {
      customers.push(
        result.getAllValues()["GROUP(custrecord_ec_customer)"][0].value
      );
      return true;
    });
    return customers;
  }
  function getCustomerEmails(customerId, type) {
    var emails = [];
    var sendTransactionField = "";
    if (type == "Invoice") sendTransactionField = "custrecord_ec_send_invoices";
    else sendTransactionField = "custrecord_ec_send_so";
    log.debug(type, sendTransactionField + " cust id " + customerId);
    var customrecord_blk_email_contactSearchObj = search.create({
      type: "customrecord_blk_email_contact",
      filters: [
        ["custrecord_ec_customer", "anyof", customerId],
        "AND",
        [sendTransactionField, "is", "T"],
      ],
      columns: [
        search.createColumn({
          name: "custrecord_ec_email",
          label: "Email Address",
        }),
      ],
    });
    var searchResultCount = customrecord_blk_email_contactSearchObj.runPaged()
      .count;
    log.debug(
      "customrecord_blk_email_contactSearchObj result count",
      searchResultCount
    );
    customrecord_blk_email_contactSearchObj.run().each(function (result) {
      emails.push(result.getValue("custrecord_ec_email"));
      return true;
    });
    return emails;
  }
  function searchSalesOrders(customers) {
    var transactions = [];
    var filterArr = ["customer.internalid", "anyof"];
    customers.forEach(function (customer) {
      filterArr.push(customer);
    });
    var salesorderSearchObj = search.create({
      type: "salesorder",
      filters: [
        ["type", "anyof", "SalesOrd"],
        "AND",
        ["custbody_blk_ack_sent", "is", "F"],
        "AND",
        filterArr,
        "AND",
        ["mainline", "is", "T"],
      ],
      columns: [
        search.createColumn({ name: "internalid", label: "Internal ID" }),
        search.createColumn({ name: "currency", label: "Currency" }),
        search.createColumn({
          name: "internalid",
          join: "customer",
          label: "Internal ID",
        }),
        search.createColumn({
          name: "transactionname",
          label: "Transaction Name",
        }),
      ],
    });
    var searchResultCount = salesorderSearchObj.runPaged().count;
    log.debug("salesorderSearchObj result count", searchResultCount);
    salesorderSearchObj.run().each(function (result) {
      transactions.push({
        id: result.getValue("internalid"),
        currency: result.getValue("currency"),
        customer: result.getAllValues()["customer.internalid"][0].value,
        tranid: result.getValue("transactionname"),
      });
      return true;
    });
    return transactions;
  }
  function searchInvoices(customers) {
    var transactions = [];
    var filterArr = ["customer.internalid", "anyof"];
    customers.forEach(function (customer) {
      filterArr.push(customer);
    });
    var invoiceSearchObj = search.create({
      type: "invoice",
      filters: [
        ["type", "anyof", "CustInvc"],
        "AND",
        ["custbody_blk_inv_emailed", "is", "F"],
        "AND",
        filterArr,
        "AND",
        ["datecreated", "after", "01/01/2020 11:59 pm"],
        "AND",
        ["mainline", "is", "T"],
        "AND",
        ["postingperiod", "rel", "TFY"],
      ],
      columns: [
        search.createColumn({ name: "internalid", label: "Internal ID" }),
        search.createColumn({ name: "currency", label: "Currency" }),
        search.createColumn({
          name: "internalid",
          join: "customer",
          label: "Internal ID",
        }),
        search.createColumn({
          name: "transactionname",
          label: "Transaction Name",
        }),
      ],
    });
    var searchResultCount = invoiceSearchObj.runPaged().count;

    invoiceSearchObj.run().each(function (result) {
      transactions.push({
        id: result.getValue("internalid"),
        currency: result.getValue("currency"),
        customer: result.getAllValues()["customer.internalid"][0].value,
        tranid: result.getValue("transactionname"),
      });
      return true;
    });
    return transactions;
  }
  function getEmailAuthor() {
    var employeeSearchObj = search.create({
      type: "employee",
      filters: [["custentity_official_email_author", "is", "T"]],
      columns: [
        search.createColumn({
          name: "entityid",
          sort: search.Sort.ASC,
          label: "Name",
        }),
        search.createColumn({ name: "internalid", label: "Internal ID" }),
      ],
    });
    var searchResultCount = employeeSearchObj.runPaged().count;
    var id = "";
    employeeSearchObj.run().each(function (result) {
      id = result.getValue("internalid");
    });
    return id;
  }
  function searchTemplate(currency) {
    var customrecord258SearchObj = search.create({
      type: "customrecord258",
      filters: [["custrecord_ctm_currency", "anyof", currency]],
      columns: [
        search.createColumn({
          name: "custrecord_ctm_template",
          label: "PDF Template",
        }),
      ],
    });
    var searchResultCount = customrecord258SearchObj.runPaged().count;
    log.debug("customrecord258SearchObj result count", searchResultCount);
    var templateId = "";
    customrecord258SearchObj.run().each(function (result) {
      templateId = result.getValue("custrecord_ctm_template");
    });
    return templateId;
  }
  return {
    execute: execute,
  };
});
