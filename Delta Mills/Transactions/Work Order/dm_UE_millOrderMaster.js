/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

/*global define,log */

define(['N/record', 'N/format'], (record, format) => {
  /* ----------------------------- Global Variables - Begin ---------------------------- */
  const exports = {};
  /* ------------------------------ Global Variables - End ----------------------------- */
  //
  /* --------------------------- Before Load - Begin -------------------------- */
  const beforeLoad = (scriptContext) => {
    const strLoggerTitle = ' Before Load ';
    log.audit(
      strLoggerTitle,
      '|>--------------------- ' +
        strLoggerTitle +
        ' - Entry ---------------------<|'
    );
    //
    try {
      if (scriptContext.type !== scriptContext.UserEventType.VIEW) {
        return;
      }
      const objForm = scriptContext.form;
      objForm.clientScriptModulePath = 'SuiteScripts/callForSuitelet_WO.js';
      objForm.addButton({
        id: 'custpage_suiteletbutton',
        label: "Print DOP's",
        functionName: 'CallforSuiteletWO',
      });
      objForm.addButton({
        id: 'custpage_suiteletbutton_misc',
        label: 'Print Misc',
        functionName: 'miscButton',
      });
    } catch (error) {
      log.error(strLoggerTitle + ' caught an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>--------------------- ' +
        strLoggerTitle +
        ' - Exit ---------------------<|'
    );
  };
  /* --------------------------- Before Load - End -------------------------- */
  //
  /* -------------------------- Before Submit - Begin ------------------------- */
  const beforeSubmit = (scriptContext) => {
    const strLoggerTitle = ' Before Submit ';
    log.audit(
      strLoggerTitle,
      '|>--------------------- ' +
        strLoggerTitle +
        ' - Entry ---------------------<|'
    );
    //
    try {
      var millOrderRecord = scriptContext.newRecord;

      var invtPartFlag = 'N';
      /* ---------------------------- Body Fields Begin --------------------------- */
      //Retrive Scheduled Week Of Production
      var scheduleWeekOfProduction = millOrderRecord.getValue({
        fieldId: 'custbody_dm_sched_wo_production',
      });
      if (scheduleWeekOfProduction) {
        scheduleWeekOfProduction = format.parse({
          value: scheduleWeekOfProduction,
          type: format.Type.DATE,
        });
      }

      const millOrderStatus = millOrderRecord.getValue({
        fieldId: 'custbody_dm_mill_order_status_mo',
      });

      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const year = today.getFullYear();
      const date = month + '/' + day + '/' + year;

      log.audit(strLoggerTitle, ' Todays Date: ' + date);

      // Mill Order Status = 9 - Completed
      // Mill Order Status = 4 - Ship Staged

      log.audit(strLoggerTitle, ' Mill Order Status ' + millOrderStatus);

      if (millOrderStatus == '9') {
        millOrderRecord.setValue({
          fieldId: 'custbody_dm_prod_start_date',
          value: today,
        });
      } else if (millOrderStatus == '4') {
        millOrderRecord.setValue({
          fieldId: 'custbody_dm_prod_end_date',
          value: today,
        });
      }

      //Retrive Mill Order #
      var millOrderNumber = millOrderRecord.getValue({ fieldId: 'tranid' });

      /* ----------------------------- Body Fields End ---------------------------- */
      //
      /* ---------------------------- Line Fields Begin --------------------------- */
      var lineItemCount = millOrderRecord.getLineCount({ sublistId: 'item' });
      for (var i = 0; i < lineItemCount; i++) {
        //Item Type
        var itemType = millOrderRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'itemtype',
          line: i,
        });
        if (itemType === 'InvtPart') {
          invtPartFlag = 'Y';
          // Component Item
          var componentItem = millOrderRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'item_display',
            line: i,
          });
          // Quantity
          var quantity = millOrderRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            line: i,
          });
          // Quantity Back Ordered
          var backOrderQty = millOrderRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'quantitybackordered',
            line: i,
          });
          // Quantity Available
          var quantityAvailable = millOrderRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'quantityavailable',
            line: i,
          });
          // Quantity On Hand
          var quantityAllocated = millOrderRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'quantityonhand',
            line: i,
          });
          // Quantity Remaining On
          var quantityRemainingOn = quantityAllocated - quantityAvailable;
          // Quantity Remaining
          var quantityRemaining = backOrderQty - quantityAllocated;
        }
      }
      /* ----------------------------- Line Fields End ---------------------------- */
      //
      if (invtPartFlag === 'Y') {
        /* -------------------------- Create Custom Record -  Begin -------------------------- */
        var customRec = record.create({
          type: 'customrecord_millpodetails',
          isDynamic: true,
        });
        /* ---------------------------- Set Values Begin ---------------------------- */
        customRec.setValue({
          fieldId: 'custrecord_mo_millordernumber',
          value: millOrderNumber,
        });
        customRec.setValue({
          fieldId: 'custrecord_mo_componentitemnumber',
          value: componentItem,
        });
        customRec.setValue({
          fieldId: 'custrecord_mo_scheduledwkprod',
          value: scheduleWeekOfProduction,
        });
        customRec.setValue({
          fieldId: 'custrecord_mo_millorderqty',
          value: quantity,
        });
        /* ---------------------------- Caculations Begin --------------------------- */
        if (
          backOrderQty <= 0 ||
          backOrderQty === null ||
          backOrderQty === undefined
        ) {
          backOrderQty = 0;
        }
        customRec.setValue({
          fieldId: 'custrecord_mo_backorderqty',
          value: backOrderQty,
        });
        if (
          quantityAvailable <= 0 ||
          quantityAvailable === null ||
          quantityAvailable === undefined
        ) {
          quantityAvailable = 0;
        }
        customRec.setValue({
          fieldId: 'custrecord_mo_availableon',
          value: quantityAvailable,
        });
        if (
          quantityAllocated <= 0 ||
          quantityAllocated === null ||
          quantityAllocated === undefined
        ) {
          quantityAllocated = 0;
        }
        customRec.setValue({
          fieldId: 'custrecord_mo_allocatedon',
          value: quantityAllocated,
        });
        if (
          quantityRemainingOn <= 0 ||
          quantityRemainingOn === null ||
          quantityRemainingOn === undefined
        ) {
          quantityRemainingOn = 0;
        }
        customRec.setValue({
          fieldId: 'custrecord_mo_remainingon',
          value: quantityRemainingOn,
        });
        if (
          quantityRemaining <= 0 ||
          quantityRemaining === undefined ||
          quantityRemaining === null
        ) {
          quantityRemaining = 0;
        }
        customRec.setValue({
          fieldId: 'custrecord_mo_remaining',
          value: quantityRemaining,
        });
        /* ---------------------------- Caculations End --------------------------- */
        //
        /* ---------------------------- Set Values End ---------------------------- */
        //
        customRec.save();
        /* -------------------------- Create Custom Record -  End-------------------------- */
      }
    } catch (error) {
      log.error(strLoggerTitle + ' caught an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>--------------------- ' +
        strLoggerTitle +
        ' - Exit ---------------------<|'
    );
  };
  /* --------------------------- Before Submit - End -------------------------- */
  //
  /* -------------------------- After Submit - Begin ------------------------- */
  const afterSubmit = (context) => {
    const strLoggerTitle = ' After Submit ';
    log.audit(
      strLoggerTitle,
      '|>--------------------- ' +
        strLoggerTitle +
        ' - Entry ---------------------<|'
    );
    //
    try {
      if (context.type === context.UserEventType.CREATE) {
        // internal ID of the Work Order
        var wo_internalID = context.newRecord.id;
        //load the Work Order record
        var wo = record.load({
          type: record.Type.WORK_ORDER,
          id: wo_internalID,
          isDynamic: true,
        });

        //Read the Assembly Item
        var aiInternalID = Number(wo.getValue({ fieldId: 'assemblyitem' }));

        //internal ID of the Sales Order that the Work Order was created from
        var createdFromSO = Number(wo.getValue({ fieldId: 'createdfrom' }));

        //Quantity
        var quantityWO = Number(wo.getValue({ fieldId: 'quantity' }));

        //if the Created From field on the Work Order has a value, do the following:
        if (createdFromSO != '' && createdFromSO != null) {
          /* ---------------------------- Sales Order Begin --------------------------- */
          //load the Sales Order record
          var so = record.load({
            type: record.Type.SALES_ORDER,
            id: createdFromSO,
            isDynamic: true,
          });
          var soLineItemCount = so.getLineCount({
            sublistId: 'item',
          });
          var soStatus = so.getValue({ fieldId: 'custbody_job_status' });
          var totalLines = so.getValue({
            fieldId: 'custbody_dm_total_so_lines',
          });
          var leadTime = so.getValue({ fieldId: 'custbody_lead_time' });

          for (var i = 0; i < soLineItemCount; i++) {
            var soItemId = Number(
              so.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i,
              })
            );
            log.debug({ title: 'soItemID', details: [soItemId, aiInternalID] });
            if (soItemId === aiInternalID) {
              var quantitySO = Number(
                so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'quantity',
                  line: i,
                })
              );
              if (quantitySO === quantityWO) {
                /* ---------------------- Transaction Line Items Begin ---------------------- */
                var sellQty = Number(
                  so.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_dm_sell_qty',
                    line: i,
                  })
                );
                var sellUOM = so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_dm_sell_uom',
                  line: i,
                });

                var productName = so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol3',
                  line: i,
                });
                var application = so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol4',
                  line: i,
                });
                var millProfile = so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol2',
                  line: i,
                });
                var fdThickness = so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_dm_fd_thickness',
                  line: i,
                });
                var fdFaceWidth = so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_dm_fd_exp_face_width',
                  line: i,
                });
                var lengths = so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol1',
                  line: i,
                });
                var finish = so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_wood_finish',
                  line: i,
                });
                var sampleReference = so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_dm_sample_reference',
                  line: i,
                });
                var salesNotes = so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_dm_sales_order_notes',
                  line: i,
                });
                var productionNotes = so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol6',
                  line: i,
                });
                var reliefCuts = so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_dm_relief_cuts',
                  line: i,
                });
                var totalLinearFeet = so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_dm_linear_feet',
                  line: i,
                });
                var squareFeetRawLumber = so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_dm_square_feet_raw_lumber',
                  line: i,
                });
                var totalSquareFeet = so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_dm_total_square_feet',
                  line: i,
                });
                var lineNumber = so.findSublistLineWithValue({
                  sublistId: 'item',
                  fieldId: 'item',
                  value: soItemId,
                });

                var firstCoat = so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_dm_first_coat',
                  line: i,
                });
                var secondCoat = so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_dm_second_coat',
                  line: i,
                });
                var thirdCoat = so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_dm_third_coat',
                  line: i,
                });
                var firstAddGallons = so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_dm_first_add_gallons',
                  line: i,
                });
                var firstAppMethod = so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_dm_first_app_method',
                  line: i,
                });
                var firstCoverage = so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_dm_first_coverage',
                  line: i,
                });
                var secondAddGallons = so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_dm_second_add_gallons',
                  line: i,
                });
                var secondAppMethod = so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_dm_second_app_method',
                  line: i,
                });
                var secondCoverage = so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_dm_second_coverage',
                  line: i,
                });
                var thirdAddGallons = so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_dm_third_add_gallons',
                  line: i,
                });
                var thirdAppMethod = so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_dm_third_app_method',
                  line: i,
                });
                var thirdCoverage = so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_dm_third_coverage',
                  line: i,
                });
                var rework = so.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_dm_rework_line',
                  line: i,
                });
                /* ---------------------- Transaction Line Items End ---------------------- */
                break;
              }
            }
          }
          /* ---------------------------- Sales Order End --------------------------- */
          //
          /* ----------------------- Work Order Assignment Begin ---------------------- */
          //SellUOM
          if (sellUOM) {
            wo.setValue({
              fieldId: 'custbody_dm_opp_uom',
              value: sellUOM,
            });
          }
          //Product Name
          if (productName) {
            wo.setValue({
              fieldId: 'custbody_dm_product_name_mo',
              value: productName,
            });
          }
          //Application
          if (application) {
            wo.setValue({
              fieldId: 'custbody_dm_application_mo',
              value: application,
            });
          }
          //Mill Profile
          if (millProfile) {
            wo.setValue({
              fieldId: 'custbody_dm_mill_profile_mo',
              value: millProfile,
            });
          }
          //Finished Dimensions - Thickness
          if (fdThickness) {
            wo.setValue({
              fieldId: 'custbody_dm_fin_thickness_mo',
              value: fdThickness,
            });
          }
          //Finished Dimensions - Exposed Face Width
          if (fdFaceWidth) {
            wo.setValue({
              fieldId: 'custbody_dm_fin_exp_width',
              value: fdFaceWidth,
            });
          }
          //Lengths
          if (lengths) {
            wo.setValue({
              fieldId: 'custbody_dm_lengths_mo',
              value: lengths,
            });
          }
          //Finish
          if (finish) {
            wo.setValue({
              fieldId: 'custbody_dm_finish_mo',
              value: finish,
            });
          }
          //Sample Reference
          if (sampleReference) {
            wo.setValue({
              fieldId: 'custbody_dm_sample_reference_mo',
              value: sampleReference,
            });
          }
          //Sales Notes
          if (salesNotes) {
            wo.setValue({
              fieldId: 'custbody_dm_sales_order_notes',
              value: salesNotes,
            });
          }
          //Production Notes
          if (productionNotes) {
            wo.setValue({
              fieldId: 'custbody_dm_production_notes_mo',
              value: productionNotes,
            });
          }
          //Relief Cuts
          if (reliefCuts) {
            wo.setValue({
              fieldId: 'custbody_dm_relief_cuts_mo',
              value: reliefCuts,
            });
          }
          //Total Linear Feet
          if (totalLinearFeet) {
            wo.setValue({
              fieldId: 'custbody_dm_total_linear_feet_mo',
              value: totalLinearFeet,
            });
          }
          //Square Feet Raw Lumber
          if (squareFeetRawLumber) {
            wo.setValue({
              fieldId: 'custbody_dm_square_feet_raw_lumber_mo',
              value: squareFeetRawLumber,
            });
          }
          //Total Square Feet
          if (totalSquareFeet) {
            wo.setValue({
              fieldId: 'custbody_dm_total_square_feet_mo',
              value: totalSquareFeet,
            });
          }
          //Line Number
          if (lineNumber) {
            wo.setValue({
              fieldId: 'custbody_dm_line_number_mo',
              value: lineNumber,
            });
          }
          //Total Lines
          if (totalLines) {
            wo.setValue({
              fieldId: 'custbody_dm_total_lines_mo',
              value: totalLines,
            });
          }
          //Lead Time
          if (leadTime) {
            wo.setValue({
              fieldId: 'custbody_dm_leadtime_mo',
              value: leadTime,
            });
          }
          //Sell Qty
          if (sellQty) {
            wo.setValue({
              fieldId: 'custbody_dm_sell_qty_mo',
              value: sellQty,
            });
          }
          //Sales Order Status Update
          if (soStatus) {
            // wo.setValue({
            //   fieldId: "custbody_job_status",
            //   value: soStatus,
            // });
          }
          //First Coat
          if (firstCoat) {
            wo.setValue({
              fieldId: 'custbody_dm_finish_coat_mo',
              value: firstCoat,
            });
          }
          //Second Coat
          if (secondCoat) {
            wo.setValue({
              fieldId: 'custbody_dm_finish_2nd_coat_mo',
              value: secondCoat,
            });
          }
          //Third Coat
          if (thirdCoat) {
            wo.setValue({
              fieldId: 'custbody_dm_finish_3rd_coat_mo',
              value: thirdCoat,
            });
          }
          //First Add Gallons
          if (firstAddGallons) {
            wo.setValue({
              fieldId: 'custbody_dm_first_add_gallons_mo',
              value: firstAddGallons,
            });
          }
          //First App Method
          if (firstAppMethod) {
            wo.setValue({
              fieldId: 'custbody_dm_first_app_method_mo',
              value: firstAppMethod,
            });
          }
          //First Coverage
          if (firstCoverage) {
            wo.setValue({
              fieldId: 'custbody_dm_first_coat_coverage_mo',
              value: firstCoverage,
            });
          }
          //Second Add Gallons
          if (secondAddGallons) {
            wo.setValue({
              fieldId: 'custbody_dm_second_add_gallons_mo',
              value: secondAddGallons,
            });
          }
          //Second App Method
          if (secondAppMethod) {
            wo.setValue({
              fieldId: 'custbody_dm_second_app_method_mo',
              value: secondAppMethod,
            });
          }
          //Second Coverage
          if (secondCoverage) {
            wo.setValue({
              fieldId: 'custbody_dm_second_coat_coverage_mo',
              value: secondCoverage,
            });
          }
          //Third Add Gallons
          if (thirdAddGallons) {
            wo.setValue({
              fieldId: 'custbody_dm_third_add_gallons_mo',
              value: thirdAddGallons,
            });
          }
          //Third App Method
          if (thirdAppMethod) {
            wo.setValue({
              fieldId: 'custbody_dm_third_app_method_mo',
              value: thirdAppMethod,
            });
          }
          //Third Coverage
          if (thirdCoverage) {
            wo.setValue({
              fieldId: 'custbody_dm_third_coverage_mo',
              value: thirdCoverage,
            });
          }
          // Rework
          if (rework) {
            wo.setValue({
              fieldId: 'custbody_dm_rework_mo',
              value: rework,
            });
          }
          /* ----------------------- Work Order Assignment End ---------------------- */
          //save the Work Order
          var woIdSaved = wo.save({
            enableSourcing: true,
            ignoreMandatoryFields: true,
          });
        }
      }
    } catch (error) {
      log.error(strLoggerTitle + ' caught an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>--------------------- ' +
        strLoggerTitle +
        ' - Exit ---------------------<|'
    );
  };
  /* -------------------------- After Submit - End ------------------------- */
  //
  /* ------------------------ Exports Begin ------------------------ */
  exports.beforeLoad = beforeLoad;
  exports.beforeSubmit = beforeSubmit;
  exports.afterSubmit = afterSubmit;
  return exports;
  /* ------------------------ Exportst End ------------------------ */
});
