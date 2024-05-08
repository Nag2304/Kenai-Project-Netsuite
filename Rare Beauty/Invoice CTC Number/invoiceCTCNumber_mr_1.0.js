/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 */
define(["N/search", "N/record", "N/log"], function (search, record, log) {
  const exports = {};
  //
  /* ------------------------------ getInputData Begin ----------------------------- */
  function getInputData() {
    try {
      return search.create({
        type: "itemfulfillment",
        filters: [
          ["type", "anyof", "ItemShip"],
          "AND",
          ["custbody2", "isnotempty", ""],
          "AND",
          ["createdfrom.custbody2", "isempty", ""],
          "AND",
          ["createdfrom.status", "noneof", "SalesOrd:C", "SalesOrd:H"],
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
      var ctcNumber = searchResult.values["GROUP(custbody2)"];
      var salesOrderID = searchResult.values["GROUP(internalid.createdFrom)"];
      var createdFromcreatedBy =
        searchResult.values["GROUP(createdby.createdFrom)"];
      //   log.debug({
      //     title: "Map",
      //     details: [ctcNumber, salesOrderID, createdFromcreatedBy],
      //   });
      context.write({
        key: Number(salesOrderID.value),
        value: [ctcNumber, createdFromcreatedBy.text],
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
      /* --------------------- Submit Sales Order Record Begin -------------------- */
      var string = context.values[0];
      var firstValue = string
        .split(",")[0]
        .replace("[", "")
        .slice(1, string.split(",")[0].replace("[", "").length - 1);
      var secondValue = string
        .split(",")[1]
        .replace("]", "")
        .slice(1, string.split(",")[1].replace("]", "").length - 1);
      record.submitFields({
        type: record.Type.SALES_ORDER,
        id: context.key,
        values: {
          custbody2: firstValue,
          custbodycustbody_createdby: secondValue,
        },
        options: {
          enableSourcing: false,
          ignoreMandatoryFields: true,
        },
      });
      /* --------------------- Submit Sales Order Record End -------------------- */
      //
      /* ----------------------- Submit Invoice Record Begin ---------------------- */
      var invoiceSearchObj = search.create({
        type: "invoice",
        filters: [
          ["type", "anyof", "CustInvc"],
          "AND",
          ["createdfrom.internalidnumber", "equalto", context.key],
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
            custbody2: firstValue,
            custbodycustbody_createdby: secondValue,
          },
          options: {
            enableSourcing: false,
            ignoreMandatoryFields: true,
          },
        });
        return true;
      });
      /* ------------------------- Run search invoice End ------------------------- */
      /* ------------------------ Submit Invoice Record End ----------------------- */
      //
      log.debug({ title: "record update successfully", details: context.key });
    } catch (err) {
      log.debug({ title: "Reduce Error", details: err });
    }
  }
  /* ------------------------------ Reduce End----------------------------- */
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
