/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */

define(["N/search", "N/record", "N/log"], function (search, record, log) {
  const exports = {};
  /* ------------------------- Scheduled Script Begin ------------------------- */
  function execute(context) {
    try {
      var searchResultItemFulfillmentObj = {};
      const resultsArrayItemFulfillment = [];
      /* ---------------------------- Create Search Begin --------------------------- */
      var itemfulfillmentSearchObj = search.create({
        type: "itemfulfillment",
        filters: [
          ["type", "anyof", "ItemShip"],
          "AND",
          ["custbody2", "isnotempty", ""],
          "AND",
          ["createdfrom.custbody2", "isempty", ""],
          "AND",
          [
            "createdfrom.status",
            "noneof",
            "SalesOrd:C",
            "SalesOrd:H",
            "SalesOrd:G",
          ],
          "AND",
          ["mainline", "is", "T"],
        ],
        columns: [
          search.createColumn({
            name: "custbody2",
            summary: "GROUP",
            label: "Invoice CTC Number",
          }),
          search.createColumn({
            name: "internalid",
            summary: "GROUP",
            label: "Item FulFillment Internal ID",
          }),
          search.createColumn({
            name: "internalid",
            join: "createdFrom",
            summary: "GROUP",
            label: "Created From Internal ID",
          }),
          search.createColumn({
            name: "type",
            join: "createdFrom",
            summary: "GROUP",
            label: "Created From Type",
          }),
          search.createColumn({
            name: "createdby",
            join: "createdFrom",
            summary: "GROUP",
            label: "Created By",
          }),
        ],
      });
      /* ---------------------------- Create Search End --------------------------- */
      //
      /* ---------------------------- Count Search Begin ---------------------------- */
      var searchResultCount = itemfulfillmentSearchObj.runPaged().count;
      log.debug({ title: "Results Count", details: searchResultCount });
      /* ---------------------------- Count Search End ---------------------------- */
      //
      /* ------------------------- Search Operations Begin ------------------------ */
      if (searchResultCount > 0) {
        /* ---------------------------- IF Run Search Begin ---------------------------- */
        itemfulfillmentSearchObj.run().each(function (result) {
          // .run().each has a limit of 4,000 results
          /* ---------------------------- Get Results Begin --------------------------- */
          // Created From Type
          var createdFromType = result.getValue({
            name: "type",
            join: "createdFrom",
            summary: "GROUP",
          });
          searchResultItemFulfillmentObj.createdFromType = createdFromType;
          // Created From Internal ID
          var createdFromInternalID = result.getValue({
            name: "internalid",
            join: "createdFrom",
            summary: "GROUP",
          });
          searchResultItemFulfillmentObj.createdFromInternalID =
            createdFromInternalID;
          // Invoice CTC Number
          var invoiceCTCNumber = result.getValue({
            name: "custbody2",
            summary: "GROUP",
            label: "Invoice CTC Number",
          });
          searchResultItemFulfillmentObj.invoiceCTCNumber = invoiceCTCNumber;
          // Created By User
          var createdBy = result.getValue({
            name: "createdby",
            join: "createdFrom",
            summary: "GROUP",
            label: "Created By",
          });
          searchResultItemFulfillmentObj.createdBy = createdBy;
          // log.debug({
          //   title: "Values",
          //   details: [createdFromType, createdFromInternalID, invoiceCTCNumber],
          // });
          /* ---------------------------- Get Results End --------------------------- */
          // Add all the objects to Array.
          resultsArrayItemFulfillment.push(searchResultItemFulfillmentObj);
          //Reset the Object
          searchResultItemFulfillmentObj = {};
          return true;
        });
        /* ---------------------------- IF Run Search End----------------------------- */
        //
        /* -------------------- loop Thru Array of Objects Begin -------------------- */
        for (var i = 0; i < resultsArrayItemFulfillment.length; i++) {
          //
          if (resultsArrayItemFulfillment[i].createdFromType === "SalesOrd") {
            /* ---------------------------- Sales Order Begin --------------------------- */
            log.debug({
              title: "Result " + i,
              details: resultsArrayItemFulfillment[i],
            });
            record.submitFields({
              type: record.Type.SALES_ORDER,
              id: Number(resultsArrayItemFulfillment[i].createdFromInternalID),
              values: {
                custbody2: resultsArrayItemFulfillment[i].invoiceCTCNumber,
                custbodycustbody_createdby:
                  resultsArrayItemFulfillment[i].createdBy,
              },
              options: {
                enableSourcing: false,
                ignoreMandatoryFields: true,
              },
            });
            /* ---------------------------- Sales Order End--------------------------- */
            //
            /* ------------------------------ Invoice Begin ----------------------------- */
            var invoiceSearchObj = search.create({
              type: "invoice",
              filters: [
                ["type", "anyof", "CustInvc"],
                "AND",
                [
                  "createdfrom.internalidnumber",
                  "equalto",
                  Number(resultsArrayItemFulfillment[i].createdFromInternalID),
                ],
              ],
              columns: [
                search.createColumn({
                  name: "internalid",
                  summary: "GROUP",
                  label: "Internal ID",
                }),
              ],
            });
            /* ------------------------ Run search Invoice Begin ------------------------ */
            invoiceSearchObj.run().each(function (result) {
              var invoiceInternalID = result.getValue({
                name: "internalid",
                summary: "GROUP",
              });
              record.submitFields({
                type: record.Type.INVOICE,
                id: Number(invoiceInternalID),
                values: {
                  custbody2: resultsArrayItemFulfillment[i].invoiceCTCNumber,
                  custbodycustbody_createdby:
                    resultsArrayItemFulfillment[i].createdBy,
                },
                options: {
                  enableSourcing: false,
                  ignoreMandatoryFields: true,
                },
              });
              return true;
            });
            /* ------------------------- Run search invoice End ------------------------- */
            //
            /* ------------------------------- Invoice End ------------------------------ */
            //
          }
          //
        }
        /* -------------------- loop Thru Array of Objects End -------------------- */
        //
      }
      /* ------------------------- Search Operations End------------------------ */
    } catch (err) {
      log.debug({ title: "Exception Caught", details: err });
    }
  }
  /* ------------------------- Scheduled Script End ------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.execute = execute;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
