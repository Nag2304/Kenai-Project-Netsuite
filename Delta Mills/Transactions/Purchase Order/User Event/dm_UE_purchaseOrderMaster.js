/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */

/**
 * File Name: dm_UE_purchaseOrderMaster.js
 * Date                Version        Author               Description
 * 06 June 2023         1.00       Mike Williams      Created Master Script
 */

/*global define,log*/

define(['N/email', 'N/runtime', 'N/url', 'N/record', 'N/format'], (
  email,
  runtime,
  url,
  record,
  format
) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* --------------------------- Before Load - Begin -------------------------- */
  /**
   *
   * @param {Object} scriptContext
   */
  const beforeLoad = (scriptContext) => {
    const loggerTitle = ' Before Load ';
    log.audit(
      loggerTitle,
      '|>----------------' + loggerTitle + '- Entry----------------<|'
    );
    //
    try {
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>----------------' + loggerTitle + '- Exit----------------<|'
    );
  };
  /* ---------------------------- Before Load - End --------------------------- */
  //
  /* -------------------------- Before Submit - Begin ------------------------- */
  /**
   *
   * @param {Object} scriptContext
   */
  const beforeSubmit = (scriptContext) => {
    const loggerTitle = ' Before Submit ';
    log.audit(
      loggerTitle,
      '|>----------------' + loggerTitle + '- Entry----------------<|'
    );
    //
    try {
      const purchaseOrderRecord = scriptContext.newRecord;
      const purchaseOrderId = purchaseOrderRecord.id;
      let updateWOFlag = false;

      // Email Tags Functionality - Before Submit
      if (scriptContext.type === scriptContext.UserEventType.CREATE) {
        log.debug(loggerTitle, ' Context type is create');
        //
        const purchaseOrderNewRecord = purchaseOrderRecord;

        const dueDate = purchaseOrderNewRecord.getValue({
          fieldId: 'duedate',
        });

        const tagValues = [];
        const lineItemCount = purchaseOrderNewRecord.getLineCount({
          sublistId: 'item',
        });

        for (let index = 0; index < lineItemCount; index++) {
          const tagsUsed = purchaseOrderNewRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_dm_tags_used',
            line: index,
          });
          if (tagsUsed) {
            tagValues.push(tagsUsed);
          }

          // Set Expected Receive Date & Original Expected Receive Date
          if (!isEmpty(dueDate)) {
            purchaseOrderRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'expectedreceiptdate',
              line: index,
              value: dueDate,
            });

            purchaseOrderNewRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_dm_revised_rec_date',
              line: index,
              value: dueDate,
            });
          }
          //
        }

        log.debug(loggerTitle, [tagValues]);

        if (tagValues.length > 0) {
          /* ------------------------ Retrieve Record URL Begin ----------------------- */
          const scheme = 'https://';
          const host = url.resolveDomain({
            hostType: url.HostType.APPLICATION,
          });
          const relativePath = url.resolveRecord({
            recordType: record.Type.PURCHASE_ORDER,
            recordId: purchaseOrderId,
            isEditMode: false,
          });
          const myURL = scheme + host + relativePath;
          /* ------------------------ Retrieve Record URL End ----------------------- */

          const scriptObj = runtime.getCurrentScript();
          const subject = scriptObj.getParameter({
            name: 'custscript_dm_emailsubject',
          });
          if (!isEmpty(subject)) {
            let body = scriptObj.getParameter({
              name: 'custscript_dm_emailbody',
            });
            body += `
                      Please go through the below URL.
                      ${myURL}
                    `;

            email.send({
              author: runtime.getCurrentUser().id,
              recipients: 'cody@deltamillworks.com',
              subject,
              body,
            });
          }
        }
      }

      let dueDate = purchaseOrderRecord.getValue({
        fieldId: 'duedate',
      });
      if (!isEmpty(dueDate)) {
        dueDate = format.format({
          type: format.Type.DATE,
          value: dueDate,
        });
      }

      // Retrieve po line item count
      const purchaseOrderLineItemCount = purchaseOrderRecord.getLineCount({
        sublistId: 'item',
      });
      log.debug(
        loggerTitle,
        'purchase order line item count: ' + purchaseOrderLineItemCount
      );

      // Loop Thru Purchase Order Line Item Count
      for (let index1 = 0; index1 < purchaseOrderLineItemCount; index1++) {
        // Netsuite Quantity
        const netsuiteQuantity = purchaseOrderRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'quantity',
          line: index1,
        });
        if (!isEmpty(netsuiteQuantity)) {
          // Set the Original Order Quantity
          purchaseOrderRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_dm_orig_po_qty',
            line: index1,
            value: netsuiteQuantity,
          });
        }
        // Nominal Width
        let nominalWidth = purchaseOrderRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_nominal_width',
          line: index1,
        });
        // Nominal Thickness
        let nominalThickness = purchaseOrderRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_nominal_thickness',
          line: index1,
        });
        // Linear Feet
        let linearFeet = purchaseOrderRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'quantity',
          line: index1,
        });
        // Board Feet
        let boardFeet = purchaseOrderRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_dm_po_board_feet',
          line: index1,
        });

        log.debug(loggerTitle + ' Sublist Values', {
          nominalWidth,
          nominalThickness,
          linearFeet,
          boardFeet,
        });
        //
        /* ---------------------------- Board Feet Calculations Begin ---------------------------- */
        if (isEmpty(boardFeet)) {
          boardFeet = linearFeet * (nominalWidth / 12) * nominalThickness;
          boardFeet = boardFeet.toFixed(3);
          purchaseOrderRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_dm_po_board_feet',
            line: index1,
            value: boardFeet,
          });
        }
        /* ---------------------------- Board Feet Calculations End ---------------------------- */
        //
        /* ------------------ Board Length Rate Calculations Begin ------------------ */
        //Amount
        let amount = purchaseOrderRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'amount',
          line: index1,
        });

        if (boardFeet > 0 && amount > 0) {
          let boardLengthRate = purchaseOrderRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_dm_board_length_rate',
            line: index1,
          });

          if (isEmpty(boardLengthRate)) {
            boardLengthRate = amount / boardFeet;
            boardLengthRate = boardLengthRate.toFixed(3);
            purchaseOrderRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_dm_board_length_rate',
              line: index1,
              value: boardLengthRate,
            });
          }
        }
        /* ------------------ Board Length Rate Calculations End ------------------ */
        //
        /* ----------------------- Description Populated Begin ---------------------- */
        // Customer/Sales Order ID
        const customerOrderId = purchaseOrderRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_dm_related_custorder',
          line: index1,
        });
        /* ------------------- Customer/Sales Order Begin ------------------- */
        if (customerOrderId) {
          //Load Record
          const customerOrderRecord = record.load({
            type: record.Type.SALES_ORDER,
            id: Number(customerOrderId),
          });
          let customerOrderWorkOrderId;
          /* ------------------- Record Read/Write Operations Begin ------------------- */
          const customerOrderLineItemCount = customerOrderRecord.getLineCount({
            sublistId: 'item',
          });

          for (let index2 = 0; index2 < customerOrderLineItemCount; index2++) {
            //Check Values Before Setting Them
            const customerOrderPurchaseOrderNumber =
              customerOrderRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_dm_po_number',
                line: index2,
              });
            const customerOrderDueDate = customerOrderRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_dm_rec_by_date',
              line: index2,
            });
            log.debug(loggerTitle + ' Description Populated', {
              customerOrderPurchaseOrderNumber,
              customerOrderDueDate,
            });

            if (!isEmpty(customerOrderPurchaseOrderNumber)) {
              customerOrderRecord.setSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_dm_po_number',
                line: index2,
                value: purchaseOrderId,
              });
            }

            if (!isEmpty(dueDate) && isEmpty(customerOrderDueDate)) {
              customerOrderRecord.setSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_dm_rec_by_date',
                line: index2,
                value: dueDate,
              });
            }

            customerOrderWorkOrderId = customerOrderRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'woid',
              line: index2,
            });
            if (!isEmpty(customerOrderWorkOrderId)) {
              customerOrderWorkOrderId = Number(customerOrderWorkOrderId);
              record.submitFields({
                type: record.Type.WORK_ORDER,
                id: customerOrderWorkOrderId,
                values: {
                  custbody_dm_po_num_mo: purchaseOrderId,
                  custbody_dm_rec_by_date_mo: dueDate,
                },
              });
              if (updateWOFlag === false) {
                updateWOFlag = true;
                purchaseOrderRecord.setSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_dm_related_millorder',
                  value: customerOrderWorkOrderId,
                  line: index1,
                });
              }
            }
          }

          /* ------------------- Record Read/Write Operations End ------------------- */
          //Save Record
          customerOrderRecord.save();
          log.audit(loggerTitle, ' Customer Order Record Saved Successfully.');
        }
        /* ------------------- Customer/Sales Order End ------------------- */
        //
        /* ----------------------- Description Populated End ---------------------- */
        //
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>----------------' + loggerTitle + '- Exit----------------<|'
    );
  };
  /* --------------------------- Before Submit - End -------------------------- */
  //
  /* -------------------------- After Submit - Begin -------------------------- */
  /**
   *
   * @param {Object} scriptContext
   */
  const afterSubmit = (scriptContext) => {
    const loggerTitle = ' After Submit ';
    log.audit(
      loggerTitle,
      '|>----------------' + loggerTitle + '- Entry----------------<|'
    );
    //
    try {
      if (scriptContext.type !== scriptContext.UserEventType.CREATE) {
        const {
          oldRecord: purchaseOrderOldRecord,
          newRecord: purchaseOrderNewRecord,
        } = scriptContext;
        let sendEmailFlag = 'N';
        const oldRecordTagValues = [];
        const newRecordTagValues = [];
        const purchaseOrderNewRecordId = purchaseOrderNewRecord.id;
        /* ---------------------------- Old Record Begin ---------------------------- */
        const oldLineItemCount = purchaseOrderOldRecord.getLineCount({
          sublistId: 'item',
        });

        for (let index = 0; index < oldLineItemCount; index++) {
          oldRecordTagValues.push(
            purchaseOrderOldRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_dm_tags_used',
              line: index,
            })
          );
        }
        log.debug(loggerTitle + ' Old Record Tag Values', oldRecordTagValues);
        const oldRecTagValuesLength = oldRecordTagValues.length;
        /* ----------------------------- Old Record End ----------------------------- */
        //
        /* ---------------------------- New Record Begin ---------------------------- */
        const newLineItemCount = purchaseOrderNewRecord.getLineCount({
          sublistId: 'item',
        });
        for (let index1 = 0; index1 < newLineItemCount; index1++) {
          newRecordTagValues.push(
            purchaseOrderNewRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_dm_tags_used',
              line: index1,
            })
          );
        }
        log.debug(loggerTitle + ' New Record Tag Values', newRecordTagValues);
        const newRecTagValuesLength = newRecordTagValues.length;
        /* ---------------------------- New Record End ---------------------------- */
        //
        if (oldRecTagValuesLength === newRecTagValuesLength) {
          for (let index2 = 0; index2 < oldRecTagValuesLength; index2++) {
            if (oldRecordTagValues[index2] !== newRecordTagValues[index2]) {
              sendEmailFlag = 'Y';
              break;
            }
          }
        } else if (newRecTagValuesLength > oldRecTagValuesLength) {
          if (!isEmpty(newRecordTagValues[newRecTagValuesLength - 1])) {
            sendEmailFlag = 'Y';
          }
        }
        log.audit(loggerTitle, ' Send Email Flag: ' + sendEmailFlag);
        //
        /* ---------------------------- Send Email Begin ---------------------------- */
        if (sendEmailFlag === 'Y') {
          //
          /* ------------------------ Retrieve Record URL Begin ----------------------- */
          const scheme = 'https://';
          const host = url.resolveDomain({
            hostType: url.HostType.APPLICATION,
          });
          const relativePath = url.resolveRecord({
            recordType: record.Type.PURCHASE_ORDER,
            recordId: purchaseOrderNewRecordId,
            isEditMode: false,
          });
          const myURL = scheme + host + relativePath;
          /* ------------------------ Retrieve Record URL End ----------------------- */
          //
          const scriptObj = runtime.getCurrentScript();
          const subject = scriptObj.getParameter({
            name: 'custscript_dm_emailsubject',
          });
          if (!isEmpty(subject)) {
            let body = scriptObj.getParameter({
              name: 'custscript_dm_emailbody',
            });
            body += `
                  Please go through the below URL.
                  ${myURL}
                `;

            email.send({
              author: runtime.getCurrentUser().id,
              recipients: 'cody@deltamillworks.com',
              subject,
              body,
            });
          }
        }
        /* ----------------------------- Send Email End ----------------------------- */
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>----------------' + loggerTitle + '- Exit----------------<|'
    );
  };
  /* --------------------------- After Submit - End --------------------------- */
  //
  /* ------------------------ Helper Functions - Begin ------------------------ */
  //
  /* ************************** isEmpty - Begin ************************** */
  /**
   *
   * @param {String|Number} value
   * @returns {Boolean}
   */
  const isEmpty = (value) => {
    let returnValue = true;
    returnValue =
      value === null || value === undefined || value === 0 || value === '';
    return returnValue;
  };
  /* ************************** isEmpty - End ************************** */
  //
  /* ------------------------- Helper Functions - End ------------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.beforeLoad = beforeLoad;
  exports.beforeSubmit = beforeSubmit;
  exports.afterSubmit = afterSubmit;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
