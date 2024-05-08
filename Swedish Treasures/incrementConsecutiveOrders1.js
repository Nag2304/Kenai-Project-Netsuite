/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
define(["N/search", "N/record", "N/log"], function (search, record, log) {
  const exports = {};
  /* ------------------------- Scheduled Script Begin ------------------------- */
  function execute(context) {
    /* ---------------------------- Create Search Begin --------------------------- */
    var salesSearchObj = search.create({
      type: search.Type.SALES_ORDER,
      filters: [
        { name: "type", operator: "anyof", values: ["SalesOrd"] },
        { name: "mainline", operator: "is", values: ["T"] },
        {
          name: "custbody_source",
          operator: "anyof",
          values: ["2", "16", "8", "19"],
        },
        {
          formula: "CASE when {partner} != 'H' then 1 else 0 END",
          name: "formulatext",
          operator: "is",
          values: ["1"],
        },
        {
          name: "datecreated",
          operator: "after",
          values: ["05/01/2021 23:59"],
        },
      ],
      columns: [
        search.createColumn({
          name: "internalid",
          join: "customerMain",
          label: "CID",
        }),
      ],
    });
    /* ---------------------------- Create Search End --------------------------- */
    //
    /* ---------------------------- Count Search Begin ---------------------------- */
    var searchResultCount = salesSearchObj.runPaged().count;
    /* ---------------------------- Count Search End ---------------------------- */
    //
    if (searchResultCount > 0) {
      //   log.debug({
      //     title: "Sale Search Results",
      //     details: searchResultCount,
      //   });
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
        var customerInternalId = result.getValue({
          name: "internalid",
          join: "customerMain",
        });
        log.debug({
          title: "Customer",
          details: customerInternalId,
        });
        try {
          //if (customerInternalId == 581602) {
          /* ----------------------- Customer Record Load Begin ----------------------- */
          var customerRec = record.load({
            type: record.Type.CUSTOMER,
            id: customerInternalId,
            isDynamic: true,
          });
          var consecutiveOrders = Number(
            customerRec.getValue({
              fieldId: "custentity_wi_consecutiveorders",
            })
          );
          if (consecutiveOrders > 0) {
            consecutiveOrders += 1;
          } else {
            consecutiveOrders = 1;
          }
          customerRec.setValue({
            fieldId: "custentity_wi_consecutiveorders",
            value: consecutiveOrders,
          });
          customerRec.save();
          /* ----------------------- Customer Record Load End ----------------------- */
          //}
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
      /* ---------------------------- Run Search End ---------------------------- */
    }
  }
  /* ------------------------- Scheduled Script End ------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.execute = execute;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
