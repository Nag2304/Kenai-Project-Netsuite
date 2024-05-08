/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
define(["N/search", "N/record", "N/log"], function (search, record, log) {
  const exports = {};
  /* ------------------------- Scheduled Script Begin ------------------------- */
  function execute(context) {
    /* ---------------------------- Create Search Begin --------------------------- */
    var invoiceSearchObj = search.create({
      type: "invoice",
      filters: [
        ["type", "anyof", "CustInvc"],
        "AND",
        ["custbody_blk_inv_emailed", "is", "F"],
        "AND",
        ["mainline", "is", "T"],
        "AND",
        ["datecreated", "on", "yesterday"],
      ],
      columns: [
        search.createColumn({ name: "internalid", label: "Internal ID" }),
        search.createColumn({
          name: "internalid",
          join: "customer",
          label: "Internal ID",
        }),
        search.createColumn({
          name: "transactionname",
          label: "Transaction Name",
        }),
        search.createColumn({
          name: "custbody_blk_inv_emailed",
          label: "Invoice Emailed",
        }),
      ],
    });
    /* ---------------------------- Create Search End --------------------------- */
    //
    /* ---------------------------- Count Search Begin ---------------------------- */
    var searchResultCount = invoiceSearchObj.runPaged().count;
    /* ---------------------------- Count Search End ---------------------------- */
    //
    if (searchResultCount > 0) {
      log.debug({
        title: "Invoice Search Results",
        details: searchResultCount,
      });
      /* ---------------------------- Run Search Begin ---------------------------- */
      invoiceSearchObj.run().each(function (result) {
        var invoiceInternalId = result.getValue("internalid");
        var invoiceEmailed = result.getValue("custbody_blk_inv_emailed");
        if (!invoiceEmailed) {
          try {
            record.submitFields({
              type: "invoice",
              id: invoiceInternalId,
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
        }
        return true;
      });
      /* ---------------------------- Run Search End ---------------------------- */
    } else {
      log.debug({ title: "No Invoices Found" });
    }
  }
  /* ------------------------- Scheduled Script End ------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.execute = execute;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
