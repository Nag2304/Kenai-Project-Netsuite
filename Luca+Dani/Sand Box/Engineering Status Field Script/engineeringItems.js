/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */

define(["N/currentRecord", "N/log"], function (currentRecord, log) {
  const exports = {};
  /* ------------------------ Save Record Begin ------------------------ */
  function saveRecord() {
    const rec = currentRecord.get();
    //TODO: log.debug({ title: rec, details: "Current Record" });
    /* --------------------------- Assembly Item Begin --------------------------- */
    if (rec.type === "assemblyitem") {
      const engineeringStatus = rec.getValue({
        fieldId: "custitem_solupaysp_engstatus",
      });
      //TODO: log.debug({ title: engineeringStatus, details: "Engineering Status Value" });

      /**
       ** Make Changes to the Item When Sale Only (Internal ID == 6) (or) Discontinued (Internal ID == 7) is Selected
       *! Never do any Changes to the Item when it is not discontinued or sale only
       */

      // ! Rest of the values
      const isInActive = rec.getValue({ fieldId: "isinactive" });
      if (isInActive === "T") {
        rec.setValue({ fieldId: "isinactive", value: false });
      }

      //*Sale Only
      if (engineeringStatus === "6") {
        const lineItemCount = rec.getLineCount({ sublistId: "locations" });
        //TODO: log.debug({ title: lineItemCount, details: "Locations Value" });
        /* --------------------------- Locations Sublist Begin --------------------------- */
        for (var i = 0; i < lineItemCount; i++) {
          var reorderPoint = rec.getSublistValue({
            sublistId: "locations",
            fieldId: "reorderpoint",
            line: i,
          });
          var preferredStockLevel = rec.getSublistValue({
            sublistId: "locations",
            fieldId: "preferredstocklevel",
            line: i,
          });

          if (reorderPoint || preferredStockLevel) {
            rec.selectLine({ sublistId: "locations", line: i });
            if (reorderPoint) {
              //TODO: log.debug({title:reorderPoint,details:"Build Point"});
              rec.setCurrentSublistValue({
                sublistId: "locations",
                fieldId: "reorderpoint",
                value: "",
              });
            }
            if (preferredStockLevel) {
              //TODO: log.debug({title:preferredStockLevel,details:"Preferred Stock Level"});
              rec.setCurrentSublistValue({
                sublistId: "locations",
                fieldId: "preferredstocklevel",
                value: "",
              });
            }
            rec.commitLine({ sublistId: "locations" });
          }
        }
        /* --------------------------- Locations Sublist End --------------------------- */
      }
      //*Discontinued
      else if (engineeringStatus === "7") {
        rec.setValue({
          fieldId: "isinactive",
          value: true,
        });
      }
    }
    return true;
  }
  /* ------------------------ Save Record End ------------------------ */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.saveRecord = saveRecord;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
