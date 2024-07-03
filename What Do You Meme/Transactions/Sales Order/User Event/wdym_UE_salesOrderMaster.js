/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
/*global define,log*/
define([
  'N/record',
  'N/runtime',
  'N/search',
  'N/ui/serverWidget',
  'N/email',
  'N/format',
], (record, runtime, search, serverWidget, email, format) => {
  const exports = {};
  /* --------------------------- before Load - Begin -------------------------- */
  const beforeLoad = (scriptContext) => {
    const loggerTitle = 'Before Load';
    try {
      // Warning: This approach requires direct DOM manipulation which NetSuite
      // may deprecate in a future release, possibly causing this code to break (see Answer Id: 10085).
      scriptContext.form.addField({
        id: 'custpage_stickyheaders_script',
        label: 'Hidden',
        type: serverWidget.FieldType.INLINEHTML,
      }).defaultValue =
        '<script>' +
        '(function($){' +
        '$(function($, undefined){' +
        '$(".uir-machine-table-container")' + // All NetSuite tables are wrapped in this CSS class
        '.css("max-height", "70vh")' +
        // Make header row sticky.
        '.bind("scroll", (event) => {' +
        '$(event.target).find(".uir-machine-headerrow > td,.uir-list-headerrow > td")' +
        '.css({' +
        '"transform": `translate(0, ${event.target.scrollTop}px)`,' +
        '"z-index": "9999",' + // See Note #1 below
        '"position": "relative"' +
        '});' +
        '})' +
        // Make floating action bar in edit mode sticky.
        '.bind("scroll", (event) => {' +
        '$(".machineButtonRow > table")' +
        '.css("transform", `translate(${event.target.scrollLeft}px)`);' +
        '});' +
        '});' +
        '})(jQuery);' +
        '</script>';
      if (scriptContext.type !== scriptContext.UserEventType.VIEW) {
        return;
      }
      const objForm = scriptContext.form;

      objForm.clientScriptModulePath = 'SuiteScripts/callForSuitelet_CS.js';
      objForm.addButton({
        id: 'custpage_suiteletbutton',
        label: 'Print Deposit',
        functionName: 'CallforSuiteletSO()',
      });

      const salesOrderRecord = scriptContext.newRecord;

      // Retrieve the transaction date
      const trandate = salesOrderRecord.getValue({
        fieldId: 'trandate',
      });
      log.debug(loggerTitle + ' Tran Date', { trandate });

      // Get today's date
      const today = new Date();

      // Format the dates for comparison
      const trandateFormatted = format.format({
        value: trandate,
        type: format.Type.DATE,
      });

      const todayFormatted = format.format({
        value: today,
        type: format.Type.DATE,
      });

      log.debug(loggerTitle + ' Dates', { trandateFormatted, todayFormatted });

      // Compare dates
      //if (trandateFormatted === todayFormatted) {
      const commercialInvoicePrinted = salesOrderRecord.getValue({
        fieldId: 'custbody_wdym_comm_inv_printed',
      });
      const shipToCountry = salesOrderRecord.getValue({
        fieldId: 'shipcountry',
      });
      log.debug(loggerTitle, { commercialInvoicePrinted, shipToCountry });
      //
      if (
        !commercialInvoicePrinted &&
        shipToCountry !== 'US' &&
        trandateFormatted === todayFormatted
      ) {
        log.debug(loggerTitle, ' Triggered Commercial Invoice Logic');
        objForm.addButton({
          id: 'custpage_commercial_invoice_btn',
          label: 'Commercial Invoice',
          functionName: 'callCommercialInvoiceSuitelet()',
        });
      }
      //}
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
  };
  /* ---------------------------- before Load - End --------------------------- */
  //
  /* ------------------------ Before Submit Script Begin ------------------------ */
  const beforeSubmit = (scriptContext) => {
    let innerLoopFlag = 'N';
    let quantityLine = false;
    const strLoggerTitle = 'Before Submit';

    log.audit(
      strLoggerTitle,
      '|>----------------' + strLoggerTitle + '- Begin ----------------<|'
    );
    try {
      const salesRecord = scriptContext.newRecord;

      const customerId = salesRecord.getValue({ fieldId: 'entity' });

      const currency = salesRecord.getValue({ fieldId: 'currency' }).toString();

      if (customerId) {
        //
        /* ----------------- Prevent Email from Being Sent  - Begin ----------------- */
        const opsHold = salesRecord.getValue({ fieldId: 'custbody_ops_hold' });
        if (opsHold === '17') {
          salesRecord.setValue({ fieldId: 'tobeemailed', value: false });
          salesRecord.setValue({ fieldId: 'email', value: '' });
        }
        /* ------------------- Prevent Email from Being Sent - End ------------------ */
        //

        const soHeaderCancelReason = salesRecord.getValue({
          fieldId: 'custbody_wdym_cancel_reason',
        });

        const lineItemCount = salesRecord.getLineCount({ sublistId: 'item' });

        // Lookup necessary fields for the customer using the provided customerId
        const customerFields = search.lookupFields({
          type: search.Type.CUSTOMER,
          id: String(customerId),
          columns: [
            'custentity_wdym_exception',
            'category',
            'companyname',
            'pricelevel',
            'custentity_required_deposit_percent',
            'daysoverdue',
            'creditlimit',
            'balance',
          ],
        });

        // Extract the number of days overdue and past due amount from the customer's lookup fields
        const daysOverdue = customerFields.daysoverdue;

        // Load the customer record to check the credit hold status
        const customerRecord = record.load({
          type: 'customer',
          id: customerId,
        });

        // Retrieve the current credit hold status from the customer record
        const creditHoldStatus = customerRecord.getValue({
          fieldId: 'creditholdoverride',
        });

        // Credit Limit
        const creditLimit = customerRecord.getValue({
          fieldId: 'creditlimit',
        });

        // Balance
        const balance =
          Number(
            customerRecord.getValue({
              fieldId: 'balance',
            })
          ) || 0;

        //Unbilled Orders
        const unBilledOrders =
          Number(
            customerRecord.getValue({
              fieldId: 'unbilledorders',
            })
          ) || 0;

        // Log the days overdue and the credit hold status for debugging purposes
        log.debug(
          strLoggerTitle,
          'Days Overdue: ' +
            daysOverdue +
            ' Credit Hold Status: ' +
            creditHoldStatus +
            ' Credit Limit: ' +
            creditLimit +
            ' Balance: ' +
            balance +
            ' Un-billed Orders: ' +
            unBilledOrders
        );
        //
        /* ---------------------- Credit Hold Check Logic - Begin ---------------------- */
        if (scriptContext.type === scriptContext.UserEventType.CREATE) {
          if (
            creditHoldStatus === 'ON' ||
            (creditHoldStatus === 'AUTO' && !creditLimit)
          ) {
            salesRecord.setValue({
              fieldId: 'custbody_wdym_credit_hold',
              value: true,
            });
            log.debug(
              strLoggerTitle,
              ' Credit Hold Check Box set to true for credit limit ON OR AUTO'
            );
          } else if (creditHoldStatus === 'AUTO') {
            const transactionAmount =
              creditHoldCalculationforSOAndInv(customerId) +
              balance +
              unBilledOrders;
            log.debug(
              strLoggerTitle,
              ' Transaction amount: ' + transactionAmount
            );
            if (transactionAmount > Number(creditLimit)) {
              salesRecord.setValue({
                fieldId: 'custbody_wdym_credit_hold',
                value: true,
              });
              log.debug(
                strLoggerTitle,
                ' Credit Hold Check Box set to true for credit limit AUTO'
              );
            }
          }
        }
        /* ---------------------- Credit Hold Check Logic - End ------------------------ */
        //
        /* ------------------- Required Deposit Percentage - Begin ------------------ */
        if (customerFields.custentity_required_deposit_percent.length) {
          const requiredDepositPercent = parseFloat(
            customerFields.custentity_required_deposit_percent[0].text
          );

          log.debug(
            'Before Submit Event',
            ' Required Deposit Percent:' + requiredDepositPercent
          );

          if (requiredDepositPercent > 0 && !isNaN(requiredDepositPercent)) {
            salesRecord.setValue({
              fieldId: 'requireddepositpercentage',
              value: requiredDepositPercent,
            });
          }
        }
        /* ------------------- Required Deposit Percentage - End ------------------ */
        //
        const exceptionCheckBox = customerFields.custentity_wdym_exception;

        let priceLevelCustomerRecord;
        if (customerFields.pricelevel.length) {
          priceLevelCustomerRecord = customerFields.pricelevel[0].text;
        }

        log.debug({
          title: 'Exception Box',
          details: [
            customerId,
            customerFields,
            exceptionCheckBox,
            priceLevelCustomerRecord,
          ],
        });

        /* ------------------------- Item Line Count - Begin ------------------------ */

        for (let i = 0; i < lineItemCount; i++) {
          // Cancel Reason
          if (soHeaderCancelReason) {
            salesRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_wdym_cancel_reason',
              value: soHeaderCancelReason,
              line: i,
            });
          }

          const quantity = salesRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            line: i,
          });

          if (quantity >= 10) {
            quantityLine = true;
          }

          const soLineCancelReason = salesRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_wdym_cancel_reason',
            line: i,
          });
          if (soLineCancelReason) {
            salesRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'isclosed',
              value: true,
              line: i,
            });
          }
          //

          // Item ID
          const itemId = salesRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            line: i,
          });
          //

          // Item Type
          const itemType = salesRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'itemtype',
            line: i,
          });
          let itemFields;
          if (itemType == 'InvtPart') {
            itemFields = search.lookupFields({
              type: search.Type.INVENTORY_ITEM,
              id: itemId,
              columns: [
                'custitem_master_carton_pack_qty',
                'custitem_inner_carton_pack_qty',
                'custitem_wdym_new_item',
                'itemid',
                'custitem_master_carton_gtin_number',
              ],
            });
            //
            const itemIdText = itemFields.itemid;
            const newItemFlag = itemFields.custitem_wdym_new_item;
            //

            // Master Carton GTIN Number
            const masterCarton = itemFields.custitem_master_carton_gtin_number;
            log.debug(strLoggerTitle, ' Master Carton: ' + masterCarton);
            if (masterCarton) {
              salesRecord.setSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_wdym_gtin',
                value: masterCarton,
                line: i,
              });
            }
            //

            if (newItemFlag) {
              record.submitFields({
                type: record.Type.INVENTORY_ITEM,
                id: itemId,
                values: {
                  custitem_wdym_new_item: false,
                },
              });

              const scriptObject = runtime.getCurrentScript();
              const senderId = scriptObject.getParameter({
                name: 'custscript_from_user',
              });
              const recipientEmail = 'zack@relatable.com';
              if (senderId) {
                email.send({
                  author: senderId,
                  recipients: recipientEmail,
                  subject: ' A New Item has been Ordered',
                  body: itemIdText + ' has been ordered for the first time.',
                });
              }
              //
            }
          } else if (itemType == 'NonInvtPart') {
            itemFields = search.lookupFields({
              type: search.Type.NON_INVENTORY_ITEM,
              id: itemId,
              columns: [
                'custitem_master_carton_pack_qty',
                'custitem_inner_carton_pack_qty',
              ],
            });
          } else if (itemType == 'Assembly') {
            itemFields = search.lookupFields({
              type: search.Type.ASSEMBLY_ITEM,
              id: itemId,
              columns: [
                'custitem_master_carton_pack_qty',
                'custitem_inner_carton_pack_qty',
              ],
            });
          }
          const masterCartonPackQty = itemFields.custitem_master_carton_pack_qty
            ? itemFields.custitem_master_carton_pack_qty
            : '';
          salesRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_case_pack',
            value: masterCartonPackQty,
            line: i,
          });

          const innerCartonPackQty = itemFields.custitem_inner_carton_pack_qty
            ? itemFields.custitem_inner_carton_pack_qty
            : '';
          salesRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_wdym_inner',
            value: innerCartonPackQty,
            line: i,
          });

          //
          if (exceptionCheckBox) {
            // If Item ID is not Blank
            if (itemId) {
              //DO NOT SELL TO
              const itemLookUpFields = search.lookupFields({
                type: search.Type.INVENTORY_ITEM,
                id: String(itemId),
                columns: ['custitem_wdym_do_not_sell_to'],
              });
              const doNotSellTo = itemLookUpFields.custitem_wdym_do_not_sell_to
                ? itemLookUpFields.custitem_wdym_do_not_sell_to
                : '';
              /* --------------------------- Multi Select Begin --------------------------- */
              for (let j = 0; j < doNotSellTo.length; j++) {
                if (doNotSellTo[j].value == customerId) {
                  innerLoopFlag = 'Y';
                  break;
                }
              }
              /* --------------------------- Multi Select End --------------------------- */
              //
              // Set the Exception Value
              if (innerLoopFlag === 'Y') {
                innerLoopFlag = 'N';
                salesRecord.setSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_wdym_contains_prod_exception',
                  value: true,
                  line: i,
                });
              }
              //
            }
            //
          }
        }

        /* ------------------------- Item Line Count - End ------------------------ */
        //
        /* ---------------- Populate Customer Specific Price - Begin ---------------- */
        if (runtime.executionContext !== runtime.ContextType.USER_INTERFACE) {
          const category = customerFields.category[0].value;

          if (priceLevelCustomerRecord) {
            let companyName = customerFields.companyname;

            companyName = companyName.toUpperCase();
            for (let i = 0; i < lineItemCount; i++) {
              //Item ID
              const itemId = salesRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i,
              });
              // Item Type
              const itemType = salesRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'itemtype',
                line: i,
              });
              // Record Type Item
              let recItem;
              if (itemType == 'InvtPart') {
                recItem = record.load({
                  type: record.Type.INVENTORY_ITEM,
                  id: itemId,
                });
              } else if (itemType == 'NonInvtPart') {
                recItem = record.load({
                  type: record.Type.NON_INVENTORY_ITEM,
                  id: itemId,
                });
              } else if (itemType == 'Service') {
                recItem = record.load({
                  type: record.Type.SERVICE_ITEM,
                  id: itemId,
                });
              } else if (itemType == 'Assembly') {
                recItem = record.load({
                  type: record.Type.ASSEMBLY_ITEM,
                  id: itemId,
                });
              }
              //
              /* ------------------------- Items Checking - Begin ------------------------- */
              if (recItem) {
                /* ----------------------- Retrieve Price Logic Begin ----------------------- */
                let priceLevelSublistId = '';
                switch (currency) {
                  case '1':
                    priceLevelSublistId = 'price1';
                    break;
                  case '2':
                    priceLevelSublistId = 'price2';
                    break;
                  case '3':
                    priceLevelSublistId = 'price3';
                    break;
                  case '4':
                    priceLevelSublistId = 'price4';
                    break;
                  case '5':
                    priceLevelSublistId = 'price5';
                    break;
                }
                log.debug('Deteremine Price Level', {
                  priceLevelSublistId,
                  currency,
                });
                let lineCount = recItem.getLineCount({
                  sublistId: priceLevelSublistId,
                });
                //
                /* ---------------------------- Line Count Begin ---------------------------- */
                let itemPrice;
                //if the customer category is international and there is no customer specific price then FOB price.
                for (let j = 0; j < lineCount; j++) {
                  const itemCustName = recItem
                    .getSublistValue({
                      sublistId: priceLevelSublistId,
                      fieldId: 'pricelevelname',
                      line: j,
                    })
                    .toUpperCase();

                  if (itemCustName == priceLevelCustomerRecord.toUpperCase()) {
                    log.audit('item customer name', [
                      itemCustName,
                      priceLevelCustomerRecord,
                    ]);
                    itemPrice = recItem.getSublistValue({
                      sublistId: priceLevelSublistId,
                      fieldId: 'price_1_',
                      line: j,
                    });

                    break;
                  }
                }
                //
                log.debug(
                  'item price',
                  'Item price from Item record for the line ' +
                    i +
                    ' is ' +
                    itemPrice
                );
                //Fetch FOB price
                if (!itemPrice) {
                  for (let k = 0; k < lineCount; k++) {
                    const itemCustNameFob = recItem.getSublistValue({
                      sublistId: priceLevelSublistId,
                      fieldId: 'pricelevelname',
                      line: k,
                    });
                    if (itemCustNameFob === 'FOB price' && category === '6') {
                      itemPrice = recItem.getSublistValue({
                        sublistId: priceLevelSublistId,
                        fieldId: 'price_1_',
                        line: k,
                      });

                      break;
                    }
                  }
                  log.debug(
                    'item price',
                    'Item price from FOB Price ' + itemPrice
                  );
                }

                if (itemPrice) {
                  log.debug(
                    'item price',
                    'item price setting value ' + itemPrice
                  );
                  salesRecord.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_wdym_customer_price',
                    value: itemPrice,
                    ignoreFieldChange: false,
                    line: i,
                  });
                }
              }
              /* -------------------------- Items Checking - End -------------------------- */
              //
            }
          }
        }
        /* ----------------- Populate Customer Specific Price - End ----------------- */
        //
        /* ----------------------- Auto Release Orders - Begin ---------------------- */
        log.audit(strLoggerTitle, 'Auto Release Orders-Begin');

        const newCompanyName = customerFields.companyname.toUpperCase();

        const status = salesRecord.getValue({ fieldId: 'status' });

        log.audit(strLoggerTitle, {
          companyName: newCompanyName,
          status: status,
          quantityLineFlag: quantityLine,
        });

        // if (
        //   newCompanyName.includes('ZOLA') ||
        //   newCompanyName.includes('SHOPIFY')
        // ) {
        //   log.debug(strLoggerTitle, 'Status Change to Pending Fulfillment');
        //   salesRecord.setValue({
        //     fieldId: 'orderstatus',
        //     value: 'B',
        //   });
        // } else if (quantityLine) {
        //   log.debug(strLoggerTitle, 'Status Change to Pending Approval');
        //   salesRecord.setValue({
        //     fieldId: 'orderstatus',
        //     value: 'A',
        //   });
        // }

        if (
          newCompanyName.includes('SHOPIFY') ||
          newCompanyName.includes('ZOLA') ||
          newCompanyName.includes('AMAZON US FBM')
        ) {
          for (let index = 0; index < lineItemCount; index++) {
            // Location
            const location = salesRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'location',
              line: index,
            });
            //

            // Quantity
            const quantity = salesRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'quantity',
              line: index,
            });
            //

            // Quantity Committed
            const quantityCommitted = salesRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'quantitycommitted',
              line: index,
            });
            //

            // Ready To Fulfill
            const readyToFulfill = salesRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_ready_for_fulfillment',
              line: index,
            });
            //

            log.audit(strLoggerTitle, {
              location: location,
              quantity: quantity,
              quantityCommitted: quantityCommitted,
              readyToFulfill: readyToFulfill,
              line: index + 1,
            });

            if (
              quantity == quantityCommitted &&
              readyToFulfill === false &&
              quantity > 0 &&
              quantityCommitted > 0
            ) {
              salesRecord.setSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_ready_for_fulfillment',
                value: true,
                ignoreFieldChange: false,
                line: index,
              });
            }
          }
          log.audit(strLoggerTitle, 'Auto Release Orders-End');
          /* ----------------------- Auto Release Orders - End ---------------------- */
          //
        }
        //
      }
    } catch (error) {
      log.audit(
        'Before Submit for Sales Order Exception Script Failed to Submit',
        error
      );
    }
    log.audit(
      strLoggerTitle,
      '|>----------------' + strLoggerTitle + '- End ----------------<|'
    );
  };
  /* ------------------------ Before Submit Script End ------------------------ */
  //
  /* -------------------------- After Submit - Begin -------------------------- */
  const afterSubmit = (context) => {
    const loggerTitle = ' After Submit';
    log.audit(
      loggerTitle,
      '|>----------------' + loggerTitle + '- Begin ----------------<|'
    );
    //
    try {
      log.debug(loggerTitle, context.type);
      if (
        context.type === context.UserEventType.CREATE ||
        context.type === context.UserEventType.EDIT ||
        context.type === 'approve'
      ) {
        const salesOrderId = context.newRecord.id;

        const salesOrder = record.load({
          type: record.Type.SALES_ORDER,
          id: salesOrderId,
          isDynamic: true,
        });

        const readyToFulfill = salesOrder.getValue({
          fieldId: 'custbody_ready_to_fulfill_2',
        });

        const status = salesOrder.getValue({ fieldId: 'status' });

        log.debug(loggerTitle, { readyToFulfill, status });

        if (
          !readyToFulfill &&
          status !== 'Cancelled' &&
          status !== 'Pending Approval' &&
          status !== 'Closed'
        ) {
          const lineCount = salesOrder.getLineCount({
            sublistId: 'item',
          });

          let allLinesReady = false;

          for (let i = 0; i < lineCount; i++) {
            const itemType = salesOrder.getSublistValue({
              sublistId: 'item',
              fieldId: 'itemtype',
              line: i,
            });

            const isClosed = salesOrder.getSublistValue({
              sublistId: 'item',
              fieldId: 'isclosed',
              line: i,
            });

            log.debug(loggerTitle, { itemType, lineNumber: i + 1, isClosed });

            if (itemType === 'InvtPart') {
              if (isClosed === false) {
                const readyToFulfill = salesOrder.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_ready_for_fulfillment',
                  line: i,
                });
                log.debug(loggerTitle, { readyToFulfill, lineNumber: i + 1 });
                if (readyToFulfill === true) {
                  allLinesReady = true;
                } else {
                  allLinesReady = false;
                  break;
                }
              }
            } else {
              allLinesReady = false;
              break;
            }
          }

          //
          if (allLinesReady) {
            salesOrder.setValue({
              fieldId: 'custbody_ready_to_fulfill_2',
              value: true,
            });
            log.debug(
              loggerTitle,
              ' Done setting the ready to fulfill 2nd box to true'
            );
          }
          //

          salesOrder.save();
          log.audit(loggerTitle, ' Sales Order Saved successfully');
        }
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>----------------' + loggerTitle + '- End ----------------<|'
    );
  };
  /* --------------------------- After Submit - End --------------------------- */
  //
  /* --------------------------- Helper Functions - Begin --------------------------- */
  //
  /* ************************** creditHoldCalculationforSOAndInv - Begin ************************** */
  /**
   *
   * @param {Number} customerId
   * @returns {Number}
   */
  const creditHoldCalculationforSOAndInv = (customerId) => {
    const loggerTitle = ' Credit Hold Calculations for SO and INV ';
    log.debug(
      loggerTitle,
      '|>----------------' + loggerTitle + '- Begin ----------------<|'
    );
    //
    let total = 0;
    try {
      const transactionSearchObj = search.create({
        type: 'transaction',
        settings: [
          { name: 'consolidationtype', value: 'ACCTTYPE' },
          { name: 'includeperiodendtransactions', value: 'F' },
        ],
        filters: [
          ['type', 'anyof', 'SalesOrd'],
          'AND',
          ['mainline', 'is', 'T'],
          'AND',
          ['customer.internalidnumber', 'equalto', customerId],
          'AND',
          ['status', 'anyof', 'SalesOrd:A', 'SalesOrd:B'],
        ],
        columns: [
          search.createColumn({
            name: 'amount',
            summary: 'SUM',
            label: 'Amount',
          }),
        ],
      });
      const searchResultCount = transactionSearchObj.runPaged().count;
      log.debug('transactionSearchObj result count', searchResultCount);
      //
      transactionSearchObj.run().each(function (result) {
        total = Number(
          result.getValue({
            name: 'amount',
            summary: 'SUM',
            label: 'Amount',
          })
        );
      });
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>----------------' + loggerTitle + '- End ----------------<|'
    );
    return total ? total : 0;
  };
  /* ************************** creditHoldCalculationforSOAndInv - End ************************** */
  //
  /* --------------------------- Helper Functions - End --------------------------- */
  //
  /* ------------------------ Exports Begin ------------------------ */
  exports.beforeLoad = beforeLoad;
  exports.beforeSubmit = beforeSubmit;
  exports.afterSubmit = afterSubmit;
  return exports;
  /* ------------------------ Exportst End ------------------------ */
});
