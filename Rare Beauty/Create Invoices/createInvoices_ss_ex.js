/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
define(["N/search", "N/record", "N/log"], function (search, record, log) {
  const exports = {};
  /* ------------------------- Scheduled Script Begin ------------------------- */
  function execute(context) {
    /* ---------------------------- Create Search Begin --------------------------- */
    var salesOrderSearch = search.create({
      type: "transaction",
      filters: [
        ["type", "anyof", "SalesOrd"],
        "AND",
        ["location", "anyof", "2"],
        "AND",
        ["status", "anyof", "SalesOrd:F"],
      ],
      columns: [
        search.createColumn({
          name: "internalid",
          summary: "GROUP",
          label: "Internal ID",
        }),
      ],
    });
    /* ---------------------------- Create Search End --------------------------- */
    //
    /* ---------------------------- Count Search Begin ---------------------------- */
    var searchResultCount = salesOrderSearch.runPaged().count;
    log.debug({ title: "Invoice Search Results", details: searchResultCount });
    /* ---------------------------- Count Search End ---------------------------- */
    if (searchResultCount > 0) {
      /* ---------------------------- Run Search Begin ---------------------------- */
      salesOrderSearch.run().each(function (result) {
        var soInternalId = result.getValue({
          name: "internalid",
          summary: "GROUP",
        });
        soInternalId = Number(soInternalId);
        log.debug({ title: "SO Number", details: soInternalId });
        if (soInternalId) {
          try {
            /* ------------------------- Transform Record Begin ------------------------- */
            var objRecord = record.transform({
              fromType: "salesorder",
              fromId: soInternalId,
              toType: "invoice",
              isDynamic: true,
            });
            log.debug({
              title: "Transformed Record from SO to Invoice",
              details: objRecord,
            });
            var rid = objRecord.save();
            log.debug({
              title: "Saved Record Invoice",
              details: rid,
            });
            /* -------------------------- Transform Record End -------------------------- */
          } catch (err) {
            log.debug({
              title: "Failed to create Invoice from SO",
              details: err,
            });
          }
        }
        //return true;
      });
      /* ---------------------------- Run Search End ---------------------------- */
    } else {
      log.debug({ title: "No Sales Order Found for pending billing" });
    }
  }
  /* ------------------------- Scheduled Script End ------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.execute = execute;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
