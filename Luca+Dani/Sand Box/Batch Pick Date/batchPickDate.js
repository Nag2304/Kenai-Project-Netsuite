/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */

define(["N/search", "N/record", "N/log"], function (search, record, log) {
  const exports = {};

  /* ------------------------- Scheduled Script Begin ------------------------- */
  function execute(context) {
    /* ---------------------------- Load Search Begin --------------------------- */
    try {
      var salesSearch = search.load({
        id: "customsearch_ld_double_line_orders2bat_4",
        type: search.Type.SALES_ORDER,
      });
      log.debug({ title: "Search Loaded Successfully", details: salesSearch });
    } catch (err) {
      log.debug({ title: "Search Failed to Load", details: err });
    }
    /* ---------------------------- Load Search End --------------------------- */
    //

    /* ---------------------------- Run Search Begin ---------------------------- */
    function runSearch(searchObj) {
      /* ----------------------------- Get Todays Date Begin ---------------------------- */
      var date = new Date();
      var day = String(date.getDate());
      var month = String(date.getMonth() + 1);
      var fullYear = String(date.getFullYear());
      var batchPickDate = day + "/" + month + "/" + fullYear;
      /* ----------------------------- Get Todays Date End ---------------------------- */

      if (searchObj) {
        searchObj.run().each(function (result) {
          //*Sales Order Internal ID
          var salesOrderID = Number(result.getValue("internalid"));

          /* ------------------------- Submit the Field Begin ------------------------- */
          try {
            record.submitFields({
              type: record.Type.SALES_ORDER,
              id: salesOrderID,
              values: {
                custbody_ld_batch_pick: batchPickDate,
              },
            });
          } catch (err) {
            log.debug({ title: "Error submitting the field", details: err });
          }
          /* ------------------------- Submit the Field End ------------------------- */
        });
      }
    }
    /* ---------------------------- Run Search End ---------------------------- */
  }
  /* ------------------------- Scheduled Script End ------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.execute = execute;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
