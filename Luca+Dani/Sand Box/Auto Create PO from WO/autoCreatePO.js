/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(["N/record", "N/log", "N/currentRecord"], function (
  record,
  log,
  currentRecord
) {
  const exports = {};
  /* ------------------------ Page Init Begin ------------------------ */
  function pageInit() {
    try {
      // New Record
      const rec = currentRecord.get();
      /* -------------------------- Purchase Order Begin -------------------------- */
      //Get Created from Internal ID
      var createdFromId = rec.getValue({ fieldId: "createdfrom" });
      //Get Created from Text
      var createdFromText = rec.getText({ fieldId: "createdfrom" });
      //Get Vendor
      var purchaseOrderEntity = rec.getValue({ fieldId: "entity" });
      //Get Department
      var purchaseOrderDepartment = rec.getValue({ fieldId: "department" });
      /* -------------------------- Work Order Flag Begin ------------------------- */
      var woFlag = createdFromText.includes("Work Order", 0);
      if (woFlag) {
        /* ---------------------------- Work Order Begin ---------------------------- */
        //Load the Work Order Record
        var workOrderLoad = record.load({
          type: "workorder",
          id: createdFromId,
          isDynamic: true,
        });
        var workOrderDepartment = workOrderLoad.getValue({
          fieldId: "department",
        });
        var workOrderVendor = workOrderLoad.getValue({
          fieldId: "custbody_ld_wo_vendor",
        });
        /* ---------------------------- Work Order End ---------------------------- */
        //
        if (workOrderVendor) {
          rec.setValue({ fieldId: "entity", value: workOrderVendor });
        }
        if (workOrderDepartment) {
          rec.setValue({ fieldId: "department", value: workOrderDepartment });
        } else {
          rec.setValue({ fieldId: "department", value: 8 });
        }
        console.log(woFlag, workOrderDepartment, workOrderVendor);
      }
      /* -------------------------- Purchase Order End -------------------------- */
    } catch (err) {
      log.debug({ title: "Script Failed", details: err });
    }
  }
  /* ------------------------ Page Init End ------------------------ */
  //
  /* ------------------------ Save Record Begin ------------------------ */
  function saveRecord() {
    try {
      // New Record
      const rec = currentRecord.get();
      /* -------------------------- Purchase Order Begin -------------------------- */
      //Get Created from Internal ID
      var createdFromId = rec.getValue({ fieldId: "createdfrom" });
      //Get Created from Text
      var createdFromText = rec.getText({ fieldId: "createdfrom" });
      //Purchase Order Line Count
      var purchaseOrderLineItemCount = rec.getLineCount({
        sublistId: "item",
      });
      /* -------------------------- Work Order Flag Begin ------------------------- */
      var woFlag = createdFromText.includes("Work Order", 0);
      if (woFlag) {
        /* ---------------------------- Work Order Begin ---------------------------- */
        //Load the Work Order Record
        var workOrderLoad = record.load({
          type: "workorder",
          id: createdFromId,
          isDynamic: true,
        });
        var workOrderQuantity = Number(
          workOrderLoad.getValue({ fieldId: "quantity" })
        );
        /* ----------------------------- Work Order End ----------------------------- */
        //
        /* ----------------------- Other Purchase Items Begin ---------------------- */
        if (purchaseOrderLineItemCount > 0) {
          for (var i = 0; i < purchaseOrderLineItemCount; i++) {
            var purchaseOrderLineItemId = rec.getSublistValue({
              sublistId: "item",
              fieldId: "item",
              line: i,
            });
            var purchaseOrderLineItemType = rec.getSublistValue({
              sublistId: "item",
              fieldId: "itemtype",
              line: i,
            });
            var purchaseOrderLineItemQty = Number(
              rec.getSublistValue({
                sublistId: "item",
                fieldId: "quantity",
                line: i,
              })
            );
            if (
              purchaseOrderLineItemType === "OthCharge" &&
              purchaseOrderLineItemQty !== workOrderQuantity
            ) {
              var rate = purchaseOrderLineItemQty / workOrderQuantity;
              rec.selectLine({
                sublistId: "item",
                line: i,
              });
              rec.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "quantity",
                value: workOrderQuantity,
              });
              rec.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "rate",
                value: rate,
              });
              rec.commitLine({
                sublistId: "item",
              });
              rec.removeLine({
                sublistId: "item",
                line: i + 1,
                ignoreRecalc: true,
              });
            } else if (
              purchaseOrderLineItemType === "OthCharge" &&
              purchaseOrderLineItemQty === workOrderQuantity
            ) {
              rec.removeLine({
                sublistId: "item",
                line: i + 1,
                ignoreRecalc: true,
              });
            }
          }
        }
        /* ----------------------- Other Purchase Items End ---------------------- */
      } else {
        log.debug({ title: "It is not created from work order" });
      }
      /* --------------------------- Work Order Flag End -------------------------- */
      //

      /* --------------------------- Purchase Order End --------------------------- */
    } catch (err) {
      log.debug({ title: "Script Failed", details: err });
    }
    return true;
  }
  /* ------------------------ Save Record End ------------------------ */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.saveRecord = saveRecord;
  exports.pageInit = pageInit;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});

