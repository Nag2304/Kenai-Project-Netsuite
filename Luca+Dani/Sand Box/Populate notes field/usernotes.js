/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */
define(["N/currentRecord", "N/log", "N/search"], function (
  currentRecord,
  log,
  search
) {
  const exports = {};
  /* ------------------------ Save Record Begin ------------------------ */
  function pageInit() {
    var rec = currentRecord.get();
    //* var recId = rec.id;
    var recType = rec.type;
    var customerRecord = rec.getValue({
      fieldId: "entity",
    });
    customerRecord = parseInt(customerRecord);
    //TODO: log.debug({ title: "Customer Sales Order Internal ID",details: customerRecord,});
    //TODO: log.debug({ title: "Current Record", details: [recId, recType, customerRecord],});
    /* --------------------------- Sales Order Begin --------------------------- */
    if (recType === "salesorder") {
      var searchObj = search.create({
        type: search.Type.NOTE,
        filters: [["notetype", "is", "anyof", "9"]],
        columns: [
          search.createColumn({ name: "note", type: "text" }),
          search.createColumn({
            name: "internalid",
            join: "entity",
            sortdir: "ASC",
          }),
        ],
      });

      function runSearch(searchObj, rec) {
        var pickingNotesField = "";
        searchObj.run().each(function (result, index) {
          log.debug({ title: "Result", details: result });

          var customerNoteMemo = result.getValue({
            name: "note",
            type: "text",
          });
          //TODO: log.debug({ title: "Note Memo", details: customerNoteMemo });

          var entityInternalID = result.getValue({
            name: "internalid",
            join: "entity",
          });
          //TODO: log.debug({ title: "Customer InternalID", details: entityInternalID,});
          entityInternalID = parseInt(entityInternalID);

          if (customerRecord === entityInternalID) {
            log.debug({ title: "Condition Executed" });
            pickingNotesField = pickingNotesField + customerNoteMemo + "\n";
          }
          return true;
        });
        rec.setValue({
          fieldId: "custbody_ld_pick_ticket_notes",
          value: pickingNotesField,
          ignoreFieldChange: true,
        });
      }
      runSearch(searchObj, rec);
      var pickNotes = rec.getValue({
        fieldId: "custbody_ld_pick_ticket_notes",
      });
      if (pickNotes) {
        log.debug({ title: "Not Empty" });
      } else {
        log.debug({ title: "Empty" });
      }
    }
    /* --------------------------- Sales Order End --------------------------- */
    //! return true;
  }
  /* ------------------------ Save Record End ------------------------ */
  //
  function fieldChanged(scriptContext) {
    var fieldId = scriptContext.fieldId;
    var rec = scriptContext.currentRecord;
    if (fieldId === "entity") {
      log.debug({
        title: "Field Changed Event",
        details: scriptContext.currentRecord,
      });
      pageInit();
    }
  }
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.pageInit = pageInit;
  exports.fieldChanged = fieldChanged;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
