/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * Samiha Chowdhury  5/9/19 Rare Beauty Brands
 * Naveed Faraz 10/26/2019 Added after submit to update the Trandate same as fullfillment.
 */

define(["N/record", "N/search", "N/runtime", "N/format"], function (
  record,
  search,
  runtime,
  format
) {
  const INVOICE_TRANDATE = "trandate";
  const CREATED_FROM = "createdfrom";
  const ITEMFULLFILLMENT_TRANDATE = "trandate";
  const ITEMFULLFILLMENT = "itemfulfillment";
  const ISINACTIVE = "isinactive";

  var scriptObj = runtime.getCurrentScript();

  function invoiceBeforeLoad(context) {
    try {
      if (context.type == context.UserEventType.CREATE) {
        var invoice = context.newRecord;
        //error: no created from on new invoices
        var createdFromSO = invoice.getValue({
          fieldId: "createdfrom",
        });
        //log.debug('createdFromSO',createdFromSO);
        if (!isnotEmpty(createdFromSO)) {
          //create search on IF where created from is sales order int id
          var ctcSearch = search.create({
            type: "itemfulfillment",
            filters: ["createdfrom", "is", createdFromSO],
            columns: ["custbody2"],
          });
          var Results = ctcSearch.run().getRange({
            start: 0,
            end: 1000,
          });
          if (Results > 0) {
            var ctc = Results[0].getValue("custbody2");
            invoice.setValue("custbody2", ctc);
          }
        }
      }
    } catch (err) {
      log.debug({ title: "Script Encountered Error", details: err });
    }
  }

  function invoiceAfterSubmit(context) {
    if (
      context.type == context.UserEventType.CREATE &&
      runtime.executionContext !== "SCHEDULED"
    ) {
      try {
        log.debug("After Submit", "**** START ****");
        var recID = context.newRecord.id;
        var recType = context.newRecord.type;
        var objRecord = record.load({
          type: recType,
          id: recID,
          isDynamic: false,
        });

        var createdFromSO = objRecord.getValue({
          fieldId: CREATED_FROM,
        });
        var invoiceDate = objRecord.getValue({
          fieldId: INVOICE_TRANDATE,
        });

        invoiceDate = format.format({
          value: invoiceDate,
          type: format.Type.DATE,
        });

        log.debug(
          "createdFromSO :" + createdFromSO,
          "invoiceDate : " + invoiceDate
        );
        if (createdFromSO) {
          var currFullFillMentDate = getFullFillmentDate(createdFromSO);
          if (currFullFillMentDate) {
            log.debug("FullFillment Date : ", currFullFillMentDate);
            if (currFullFillMentDate != invoiceDate) {
              objRecord.setValue({
                fieldId: INVOICE_TRANDATE,
                value: new Date(currFullFillMentDate),
              });
              var submitid = objRecord.save({
                enableSourcing: true,
                ignoreMandatoryFields: true,
              });
              if (submitid) {
                log.debug("Record Successfully Submitted", "******");
              }
            }
          }
        } else {
        }
        log.debug("After Submit", "**** END ****");
      } catch (e) {
        log.error(e.name, e.message);
        log.debug("After Submit", "**** END ****");
      }
    }
  }

  function isnotEmpty(value) {
    return value == "" || value == null || value == undefined;
  }

  function getFullFillmentDate(createdFromSO) {
    if (createdFromSO) {
      var fullfillObj = search.create({
        type: ITEMFULLFILLMENT,
        columns: [
          {
            name: ITEMFULLFILLMENT_TRANDATE,
            sort: search.Sort.DESC,
          },
        ],
        filters: [
          {
            name: CREATED_FROM,
            operator: "is",
            values: createdFromSO,
          },
        ],
      });
      var searchResult = fullfillObj.run().getRange({
        start: 0,
        end: 1000,
      });

      if (parseFloat(searchResult.length) > 0) {
        var fullfillTranDate = searchResult[0].getValue({
          name: ITEMFULLFILLMENT_TRANDATE,
        });
        if (fullfillTranDate) {
          return fullfillTranDate;
        }
      } else {
        log.debug("No related fullfillment records!!!!", "**");
      }
    }
  }

  return {
    beforeLoad: invoiceBeforeLoad,
    afterSubmit: invoiceAfterSubmit,
  };
});
