/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
define(["N/search", "N/record", "N/log"], function (search, record, log) {
  const exports = {};
  /* ------------------------- Scheduled Script Begin ------------------------- */
  function execute(context) {
    try {
      /* ---------------------------- Create Search Begin --------------------------- */
      var soBatchPickSearch = search.create({
        type: "transaction",
        filters: [
          search.createFilter({
            name: "type",
            operator: "anyof",
            values: ["SalesOrd"],
          }),
          search.createFilter({
            name: "cseg_slchnl",
            operator: "anyof",
            values: ["1"],
          }),
          search.createFilter({
            name: "custbody_ld_includes_stack",
            operator: "is",
            values: ["F"],
          }),
          search.createFilter({
            name: "mainline",
            operator: "is",
            values: ["F"],
          }),
          search.createFilter({
            name: "taxline",
            operator: "is",
            values: ["F"],
          }),
          search.createFilter({
            name: "shipping",
            operator: "is",
            values: ["F"],
          }),
          search.createFilter({
            name: "status",
            operator: "anyof",
            values: ["SalesOrd:B"],
          }),
          search.createFilter({
            name: "type",
            join: "item",
            operator: "noneof",
            values: ["Discount"],
          }),
          search.createFilter({
            name: "item",
            operator: "equalto",
            summary: "count",
            values: ["1"],
          }),
        ],
        columns: [
          search.createColumn({
            name: "internalid",
            summary: "GROUP",
          }),
          search.createColumn({
            name: "tranid",
            summary: "GROUP",
          }),
          search.createColumn({
            name: "item",
            summary: "GROUP",
          }),
          search.createColumn({
            name: "quantity",
            summary: "GROUP",
          }),
        ],
      });
      /* ---------------------------- Create Search End --------------------------- */
      //
      /* ---------------------------- Count Search Begin ---------------------------- */
      var searchResultCount = soBatchPickSearch.runPaged().count;
      /* ---------------------------- Count Search End ---------------------------- */
      //
      if (searchResultCount > 0) {
        //TODO: log.debug({title: "Saved Search Ran with results",details: searchResultCount,});

        //run the search
        var resultSet = soBatchPickSearch.run();
        //TODO:log.debug({ title: "results", details: resultSet });

        //now take the first portion of data.
        var currentRange = resultSet.getRange({
          start: 0,
          end: 1000,
        });

        //!Increment variables
        var i = 0;
        var j = 0;

        while (j < currentRange.length) {
          //take the result row
          var result = currentRange[j];
          log.debug({ title: "result" + j, details: result });

          var soInternalID = result.getValue({
            name: "internalid",
            summary: "GROUP",
          });
          var soDocumentNumber = result.getValue({
            name: "tranid",
            summary: "GROUP",
          });
          var soItemName = result.getValue({ name: "item", summary: "GROUP" });
          var soQty = result.getValue({ name: "quantity", summary: "GROUP" });

          log.debug({
            details: [soInternalID, soDocumentNumber, soItemName, soQty],
          });

          //finally:
          i++;
          j++;

          if (j == 1000) {
            // check if it reaches 1000
            j = 0; // reset j an reload the next portion
            currentRange = resultSet.getRange({
              start: i,
              end: i + 1000,
            });
          }
        }
      } else {
        log.debug({
          title: "Saved Search Ran but zero results",
          details: searchResultCount,
        });
      }
    } catch (err) {
      log.debug({ title: "invalid search", details: err });
    }
  }
  /* ------------------------- Scheduled Script End ------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.execute = execute;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
