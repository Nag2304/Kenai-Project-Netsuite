/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
define(["N/search", "N/record", "N/log"], function (search, record, log) {
  const exports = {};
  /* ------------------------- Scheduled Script Begin ------------------------- */
  function execute(context) {
    /* ---------------------------- Create Search Begin --------------------------- */
    var customerSearchObj = search.create({
      type: search.Type.CUSTOMER,
      filters: [
        ["custentity_wi_consecutiveorders", "greaterthanorequalto", "3"],
      ],
      columns: [
        search.createColumn({ name: "internalid", label: "Internal ID" }),
      ],
    });
    /* ---------------------------- Create Search End --------------------------- */
    //
    /* ---------------------------- Count Search Begin ---------------------------- */
    var searchResultCount = customerSearchObj.runPaged().count;
    /* ---------------------------- Count Search End ---------------------------- */
    //
    if (searchResultCount > 0) {
      log.debug({
        title: "Customer Search Results",
        details: searchResultCount,
      });
      /* ---------------------------- Run Search Begin ---------------------------- */
      var resultSet = customerSearchObj.run();
      // now take the first portion of data.
      var currentRange = resultSet.getRange({
        start: 0,
        end: 1000,
      });
      var i = 0; // iterator for all search results
      var j = 0; // iterator for current result range 0..999
      while (j < currentRange.length) {
        var result = currentRange[j];
        var customerInternalId = result.getValue("internalid");
        try {
          record.submitFields({
            type: record.Type.CUSTOMER,
            id: customerInternalId,
            values: {
              custentity_wi_makeaccount: "T",
            },
            options: {
              enableSourcing: false,
              ignoreMandatoryFields: true,
            },
          });
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
      /* ---------------------------- Run Search End---------------------------- */
    } else {
      log.debug({ title: "No Customer Record Found" });
    }
  }
  /* ------------------------- Scheduled Script End ------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.execute = execute;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
