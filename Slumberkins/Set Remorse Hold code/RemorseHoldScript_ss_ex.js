/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
define(["N/search", "N/record", "N/log", "N/format"], function (
  search,
  record,
  log,
  format
) {
  const exports = {};
  /* ------------------------- Scheduled Script Begin ------------------------- */
  function execute(context) {
    /* ---------------------------- Create Search Begin --------------------------- */
    var salesSearchObj = search.create({
      type: search.Type.SALES_ORDER,
      filters: [
        ["type", "anyof", "SalesOrd"],
        "AND",
        ["custbody_celigo_shopify_order_no", "isnotempty", null],
        "AND",
        ["mainline", "is", "T"],
        "AND",
        ["custbody_sl_remorse_hold", "is", "T"],
      ],
      columns: [
        search.createColumn({ name: "internalid", label: "Internal ID" }),
        search.createColumn({ name: "datecreated", label: "Date Created" }),
      ],
    });
    /* ---------------------------- Create Search End --------------------------- */
    //
    /* ---------------------------- Count Search Begin ---------------------------- */
    var searchResultCount = salesSearchObj.runPaged().count;
    /* ---------------------------- Count Search End ---------------------------- */
    //
    if (searchResultCount > 0) {
      log.debug({
        title: "Sales Order Search Results",
        details: searchResultCount,
      });
      /* ---------------------------- Run Search Begin ---------------------------- */
      var resultSet = salesSearchObj.run();

      // now take the first portion of data.
      var currentRange = resultSet.getRange({
        start: 0,
        end: 1000,
      });

      var i = 0; // iterator for all search results
      var j = 0; // iterator for current result range 0..999
      while (j < currentRange.length) {
        var result = currentRange[j];
        var salesInternalId = result.getValue("internalid");
        var salesCreatedDate = result.getValue("datecreated");
        try {
          /*var cudate = new Date();
          var formattedDateTime = format.format({
            value: cudate,
            type: format.Type.DATETIME,
          });
          var formattedSalesCreatedDate = format.format({
            value: salesCreatedDate,
            type: format.Type.DATETIME,
          }); */

          var reqSalesCreatedDate = new Date(
            new Date(salesCreatedDate).getTime() -
              (new Date().getTimezoneOffset() - 120) * 60000
          );
          // log.debug({
          //   title: "DETAILS",
          //   details: [
          //     reqSalesCreatedDate,
          //     salesInternalId,
          //     new Date(
          //       new Date().getTime() - new Date().getTimezoneOffset() * 60000
          //     ),
          //   ],
          // });
          if (
            new Date(
              new Date().getTime() - new Date().getTimezoneOffset() * 60000
            ) > reqSalesCreatedDate
          ) {
            record.submitFields({
              type: record.Type.SALES_ORDER,
              id: salesInternalId,
              values: {
                custbody_sl_remorse_hold: false,
              },
              options: {
                ignoreMandatoryFields: true,
              },
            });
          }
        } catch (err) {
          log.debug({ title: "Failed to Submit Record", details: err });
        }
        // finally:
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
      log.debug({ title: "No Sales Order Record Found" });
    }
  }
  /* ------------------------- Scheduled Script End ------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.execute = execute;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
