/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 */
define(["N/search", "N/record", "N/log"], function (search, record, log) {
  const exports = {};
  var gValue = 0;
  //
  /* ------------------------------ getInputData Begin ----------------------------- */
  function getInputData() {
    try {
      return search.create({
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
            values: ["10/07/2021 23:30"],
          },
        ],
        columns: [
          search.createColumn({
            name: "internalid",
            join: "customerMain",
            sortdir: "ASC",
            label: "CID",
          }),
        ],
      });
    } catch (err) {
      log.debug({ title: "Input Data Error", details: err });
    }
  }
  /* ------------------------------ getInputData End ----------------------------- */
  //
  /* ------------------------------ Map Begin ----------------------------- */
  function map(context) {
    try {
      var searchResult = JSON.parse(context.value); //read the data
      var salesOrderId = searchResult.id;
      var entityId = searchResult.values["internalid.customerMain"];
      //   log.debug({
      //     title: "Map",
      //     details: [searchResult, salesOrderId, entityId],
      //   });
      context.write({
        key: Number(entityId.value),
        value: salesOrderId,
      });
    } catch (err) {
      log.debug({ title: "Map Error", details: err });
    }
  }
  /* ------------------------------ Map End ----------------------------- */
  //
  /* ------------------------------ Reduce Begin ----------------------------- */
  function reduce(context) {
    try {
      var customerId = context.key;
      gValue += 1;
      //log.debug({ title: "Reduce", details: [context.key] });
      /* ----------------------- Customer Record Load Begin ----------------------- */
      var customerRec = record.load({
        type: record.Type.CUSTOMER,
        id: customerId,
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
      var custRecId = customerRec.save();
      context.write({ key: custRecId, value: gValue });
      /* ----------------------- Customer Record Load End ----------------------- */
    } catch (err) {
      log.debug({ title: "Reduce Error", details: [err, customerId] });
    }
  }
  /* ------------------------------ Reduce End ----------------------------- */
  //
  /* ----------------------------- summarize Begin ---------------------------- */
  function summarize(context) {
    var totalItemsProcessed = 0;
    context.output.iterator().each(function (key, value) {
      totalItemsProcessed++;
    });
    var summaryMessage =
      "Usage: " +
      context.usage +
      " Concurrency: " +
      context.concurrency +
      " Number of yields: " +
      context.yields +
      " Total Items Processed: " +
      totalItemsProcessed;
    log.debug({ title: "Summary of usase", details: summaryMessage });
  }
  /* ----------------------------- summarize End ---------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.getInputData = getInputData;
  exports.map = map;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
