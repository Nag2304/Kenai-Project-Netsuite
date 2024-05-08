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
  var otherPurchaseArray = [];
  var saveOtherPurchaseArray = [];
  var pageInitFunction = false;
  var workOrderOtherPurchaseItemCount = 0;
  var rateFlag = false;
  /* ------------------------ Page Init Begin ------------------------ */
  function pageInit(scriptContext) {
    if (scriptContext.mode === "create") {
      try {
        // New Record
        const rec = currentRecord.get();
        /* -------------------------- Purchase Order Begin -------------------------- */
        //Get Created from Internal ID
        var createdFromId = rec.getValue({
          fieldId: "createdfrom",
        });
        //Get Created from Text
        var createdFromText = rec.getText({
          fieldId: "createdfrom",
        });
        //Purchase Order Line Count
        var purchaseOrderLineItemCount = rec.getLineCount({
          sublistId: "item",
        });
        /* -------------------------- Work Order Flag Begin ------------------------- */
        var woFlag = createdFromText.includes("Work Order", 0);
        if (woFlag) {
          pageInitFunction = true;
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
          var workOrderLineItemCount = workOrderLoad.getLineCount({
            sublistId: "item",
          });
          var workOrderQuantity = Number(
            workOrderLoad.getValue({
              fieldId: "quantity",
            })
          );
          /* ----------------------- Vendor and Department Begin ---------------------- */
          if (workOrderVendor) {
            rec.setValue({
              fieldId: "entity",
              value: workOrderVendor,
            });
          }
          if (workOrderDepartment) {
            rec.setValue({
              fieldId: "department",
              value: workOrderDepartment,
            });
          } else {
            rec.setValue({
              fieldId: "department",
              value: 8,
            });
          }
          /* ----------------------- Vendor and Department End ---------------------- */
          //
          if (workOrderLineItemCount > 0) {
            for (var k = 0; k < workOrderLineItemCount; k++) {
              var workOrderLineItemId = workOrderLoad.getSublistValue({
                sublistId: "item",
                fieldId: "item",
                line: k,
              });
              var workOrderLineItemType = workOrderLoad.getSublistValue({
                sublistId: "item",
                fieldId: "itemtype",
                line: k,
              });
              if (workOrderLineItemType === "OthCharge") {
                /* ----------------------- Other Purchase Items Begin ---------------------- */
                var otherChargeItemLoad = record.load({
                  type: "otherchargeitem",
                  id: workOrderLineItemId,
                  isDynamic: true,
                });
                var outsideBoxProcessing = otherChargeItemLoad.getValue({
                  fieldId: "custitem_ld_outside_processing",
                });
                var otherPurchaseObject = {};
                otherPurchaseObject.itemId = workOrderLineItemId;
                otherPurchaseObject.outsideBox = outsideBoxProcessing;
                otherPurchaseArray.push(otherPurchaseObject);
                if (outsideBoxProcessing === true) {
                  workOrderOtherPurchaseItemCount += 1;
                }
                /* ----------------------- Other Purchase Items End ---------------------- */
              }
            }
          }
          /* ---------------------------- Work Order End ---------------------------- */
          //
          /* ------------------ Check for other Purchase Items Begin ------------------ */
          if (workOrderOtherPurchaseItemCount > 0) {
            /* --------------------- Purchase Order Line Items Begin -------------------- */
            if (purchaseOrderLineItemCount > 0) {
              /* ---------------------- Commit Line Items Logic Begin --------------------- */
              for (var i = 0; i < purchaseOrderLineItemCount; i++) {
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
                var purchaseOrderLineItemId = rec.getSublistValue({
                  sublistId: "item",
                  fieldId: "item",
                  line: i,
                });

                // console.log(
                //   "Type==" +
                //     purchaseOrderLineItemType +
                //     " LineItemQty==" +
                //     purchaseOrderLineItemQty +
                //     " WO QTY==" +
                //     workOrderQuantity
                // );
                if (purchaseOrderLineItemType === "OthCharge") {
                  for (var m = 0; m < otherPurchaseArray.length; m++) {
                    if (
                      otherPurchaseArray[m].itemId ===
                        purchaseOrderLineItemId &&
                      otherPurchaseArray[m].outsideBox === true
                    ) {
                      if (workOrderQuantity !== purchaseOrderLineItemQty) {
                        var originalRate =
                          purchaseOrderLineItemQty / workOrderQuantity;
                        rateFlag = true;
                      } else {
                        rateFlag = false;
                      }
                      rec.selectLine({
                        sublistId: "item",
                        line: i,
                      });
                      rec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "quantity",
                        value: workOrderQuantity,
                      });
                      rec.commitLine({
                        sublistId: "item",
                      });
                      var saveOtherPurchaseObject = {};
                      saveOtherPurchaseObject.itemId = purchaseOrderLineItemId;
                      saveOtherPurchaseObject.rate = originalRate;
                      saveOtherPurchaseObject.rateFlag = rateFlag;
                      saveOtherPurchaseArray.push(saveOtherPurchaseObject);
                    }
                  }
                }
              }
              /* ---------------------- Commit Line Items Logic End --------------------- */
              //
              /* ---------------------- Remove Line Items Logic Begin --------------------- */
              var x = 0,
                y = 0;
              var removeFlag = false;
              for (var j = 0; j < purchaseOrderLineItemCount; j++) {
                var purchaseOrderLineItemType = rec.getSublistValue({
                  sublistId: "item",
                  fieldId: "itemtype",
                  line: x,
                });
                if (purchaseOrderLineItemType !== "OthCharge") {
                  rec.selectLine({
                    sublistId: "item",
                    line: x,
                  });
                  console.log(
                    "line item removed " + j + " " + purchaseOrderLineItemType
                  );
                  rec.removeLine({
                    sublistId: "item",
                    line: x,
                    ignoreRecalc: true,
                  });
                  removeFlag = true;
                  y = x;
                }
                if (removeFlag === true) {
                  removeFlag = false;
                  x = y;
                } else {
                  x += 1;
                }
              }
              //Purchase Order Line Count
              var purchaseOrderLineItemCount = rec.getLineCount({
                sublistId: "item",
              });
              console.log(otherPurchaseArray, saveOtherPurchaseArray);
              var x = 0,
                y = 0;
              var removeFlag = false;
              for (var p = 0; p < purchaseOrderLineItemCount; p++) {
                var purchaseOrderLineItemId = rec.getSublistValue({
                  sublistId: "item",
                  fieldId: "item",
                  line: x,
                });
                for (var m = 0; m < otherPurchaseArray.length; m++) {
                  if (
                    otherPurchaseArray[m].itemId === purchaseOrderLineItemId &&
                    otherPurchaseArray[m].outsideBox === false
                  ) {
                    rec.selectLine({
                      sublistId: "item",
                      line: x,
                    });
                    rec.removeLine({
                      sublistId: "item",
                      line: x,
                      ignoreRecalc: true,
                    });
                    removeFlag = true;
                    y = x;
                  }
                }
                if (removeFlag === true) {
                  removeFlag = false;
                  x = y;
                } else {
                  x += 1;
                }
              }
              /* ---------------------- Remove Line Items Logic End --------------------- */
            }
            /* --------------------- Purchase Order Line Items End -------------------- */
          } else {
            alert(
              "You have selected an item that is not marked for outside processing."
            );
          }
          /* ------------------- Check for other Purchase Items End ------------------- */
          //
        } else {
          log.debug({
            title: "It is not created from work order",
            details: woFlag,
          });
        }
        /* -------------------------- Work Order Flag End ------------------------- */
        //
        /* -------------------------- Purchase Order End -------------------------- */
      } catch (err) {
        log.debug({
          title: "Script Failed",
          details: err,
        });
      }
    }
  }
  /* ------------------------ Page Init End ------------------------ */
  //
  /* ---------------------------- Save Record Begin --------------------------- */
  function saveRecord(scriptContext) {
    if (pageInitFunction === true) {
      console.log("executed");
      try {
        // New Record
        const rec = currentRecord.get();
        /* -------------------------- Purchase Order Begin -------------------------- */
        //Get Created from Text
        var createdFromText = rec.getText({
          fieldId: "createdfrom",
        });
        //Purchase Order Line Count
        var purchaseOrderLineItemCount = rec.getLineCount({
          sublistId: "item",
        });
        /* -------------------------- Work Order Flag Begin ------------------------- */
        var woFlag = createdFromText.includes("Work Order", 0);
        if (woFlag) {
          /* ----------------------- Other Purchase Items Begin ---------------------- */
          if (purchaseOrderLineItemCount > 0) {
            for (var i = 0; i < purchaseOrderLineItemCount; i++) {
              var purchaseOrderLineItemType = rec.getSublistValue({
                sublistId: "item",
                fieldId: "itemtype",
                line: i,
              });
              var purchaseOrderLineItemId = rec.getSublistValue({
                sublistId: "item",
                fieldId: "item",
                line: i,
              });
              for (var m = 0; m < saveOtherPurchaseArray.length; m++) {
                if (
                  purchaseOrderLineItemType === "OthCharge" &&
                  purchaseOrderLineItemId ===
                    saveOtherPurchaseArray[m].itemId &&
                  saveOtherPurchaseArray[m].rateFlag === true
                ) {
                  rec.selectLine({
                    sublistId: "item",
                    line: i,
                  });
                  rec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "rate",
                    value: saveOtherPurchaseArray[m].rate,
                  });
                  rec.commitLine({
                    sublistId: "item",
                  });
                }
              }
            }
          }
        } else {
          log.debug({
            title: "It is not created from work order",
          });
        }
        /* --------------------------- Work Order Flag End -------------------------- */
        //
        /* --------------------------- Purchase Order End --------------------------- */
      } catch (err) {
        log.debug({
          title: "Script Failed",
          details: err,
        });
      }
    }
    //Must for save the record
    return true;
  }
  /* ----------------------------- Save Record End ---------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.pageInit = pageInit;
  exports.saveRecord = saveRecord;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
