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
      type: "transaction",
      filters: [
        ["type", "anyof", "SalesOrd"],
        "and",
        ["custbody_bbb_giftcard_only_order", "is", "F"],
        "AND",
        ["mainline", "is", "T"],
        "AND",
      ],
      columns: [
        search.createColumn({ name: "internalid", label: "Internal ID" }),
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
        title: "Invoice Search Results",
        details: searchResultCount,
      });
      /* ---------------------------- Run Search Begin ---------------------------- */
      salesSearchObj.run().each(function (result) {
        var salesInternalId = result.getValue("internalid");
        try {
          record.submitFields({
            type: "invoice",
            id: salesInternalId,
            values: {
              custbody_blk_inv_emailed: true,
            },
            options: {
              ignoreMandatoryFields: true,
            },
          });
        } catch (err) {
          log.debug({ title: "Failed to Submit Record", details: err });
        }
        return true;
      });
      /* ---------------------------- Run Search End ---------------------------- */
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
