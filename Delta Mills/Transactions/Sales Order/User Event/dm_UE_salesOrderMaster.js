/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

/*global define,log*/

/**
 * Script Record: DM |UE Sales Order Master
 * Fileanme: dm_UE_salesOrderMaster.js
 * Author           Date       Version               Remarks
 * Mike Williams  11-07-2022    1.00       Initial creation of the script.
 * Mike Williams  11-19-2022    1.01       Total Linear and Square Feet.
 */

define(['N/format', 'N/runtime', 'N/ui/serverWidget', 'N/record', 'N/search'], (
  format,
  runtime,
  serverWidget,
  record,
  search
) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------ Before Load Script Begin ------------------------ */
  const beforeLoad = (scriptContext) => {
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
    //
    if (scriptContext.type !== scriptContext.UserEventType.VIEW) {
      return;
    }
    const objForm = scriptContext.form;

    objForm.clientScriptModulePath = 'SuiteScripts/dm_CS_salesOrderMaster.js';
    // Print Sample
    objForm.addButton({
      id: 'custpage_suiteletbutton',
      label: 'Print Sample',
      functionName: 'CallforSuiteletSO()',
    });
    //
    // Print Deposit
    objForm.addButton({
      id: 'custpage_suiteletbutton',
      label: 'Print Deposit',
      functionName: 'CallforSuitelet()',
    });
    //
  };
  /* ------------------------ Before Load Script End ------------------------ */
  //
  /* -------------------------- beforeSubmit - Begin -------------------------- */
  const beforeSubmit = (scriptContext) => {
    const strLoggerTitle = 'Before Submit';

    log.debug(strLoggerTitle, '|>--------------Entry--------------<|');

    log.audit(strLoggerTitle, `USEREVENT TYPE: ${scriptContext.type}`);
    //
    try {
      const tranRec = scriptContext.newRecord;

      /* ---------------------- Set Required Deposit - Begin ---------------------- */
      const customForm = tranRec.getValue({
        fieldId: 'customform',
      });
      if (
        (customForm === '172' || customForm === 172) &&
        runtime.executionContext !== runtime.ContextType.USER_INTERFACE
      ) {
        log.debug({
          title: 'Custom Form',
          details: [customForm, runtime.executionContext],
        });
        tranRec.setValue({
          fieldId: 'requireddepositpercentage',
          value: '60.00',
        });
      }
      /* ---------------------- Set Required Deposit - End ---------------------- */
      //
      /* ------------------------- Three PL Logic - Begin ------------------------- */
      const threePLCheckbox = tranRec.getValue({ fieldId: 'custbody_dm_3pl' });
      const threePLDate = tranRec.getValue({
        fieldId: 'custbody_dm_datesentto_3pl',
      });

      if (threePLCheckbox && !threePLDate) {
        log.debug(strLoggerTitle, 'Setting 3PL Date');
        tranRec.setValue({
          fieldId: 'custbody_dm_datesentto_3pl',
          value: format.parse({ value: new Date(), type: format.Type.DATE }),
        });
      } else {
        log.audit(
          strLoggerTitle,
          `Date Set Already:${threePLDate} 3PL Checkbox:${threePLCheckbox}`
        );
      }
      /* ------------------------- Three PL Logic - End ------------------------- */
      //
      /* --------------------------- Job Status - Begin --------------------------- */
      const soStatus = tranRec.getValue({ fieldId: 'custbody_job_status' });
      log.debug(strLoggerTitle, { soStatus });
      if (soStatus === '9') {
        const today = new Date();
        // const month = today.getMonth() + 1;
        // const day = today.getDate();
        // const year = today.getFullYear();
        // const date = month + '/' + day + '/' + year;
        tranRec.setValue({
          fieldId: 'custbody_dm_prod_start_date',
          value: today,
        });
      }
      /* ---------------------------- Job Status - End ---------------------------- */
      //
      /* ------------------------- Populate Dates - Begin ------------------------- */
      populateDates(scriptContext);
      /* -------------------------- Populate Dates - End -------------------------- */
      //
      /* ---------------------- LineLevelCalculation - Begin ---------------------- */
      if (customForm !== '190' || customForm !== 190) {
        lineLevelCalculation(tranRec);
      }
      /* ---------------------- LineLevelCalculation - End ---------------------- */
    } catch (error) {
      log.error(strLoggerTitle + ' caught an exception', error);
    }
    //
    log.debug(strLoggerTitle, '|>--------------Exit--------------<|');
  };
  /* --------------------------- beforeSubmit - End --------------------------- */
  //
  /* -------------------------- After Submit - Begin -------------------------- */
  const afterSubmit = (scriptContext) => {
    const strLoggerTitle = ' After Submit';
    log.audit(
      strLoggerTitle,
      '|>---------------- ' + strLoggerTitle + ' - Entry----------------<|'
    );
    //
    try {
      const soRecord = record.load({
        type: record.Type.SALES_ORDER,
        id: scriptContext.newRecord.id,
        isDynamic: true,
      });

      const soLineCount = soRecord.getLineCount({ sublistId: 'item' });

      //
      /* ------------------------- Read Each Line - Begin ------------------------- */
      const data = [];
      for (let index = 0; index < soLineCount; index++) {
        soRecord.selectLine({ sublistId: 'item', line: index });

        const finish = {};

        const itemType = soRecord.getCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'itemtype',
        });

        if (itemType == 'Assembly') {
          const itemQty = soRecord.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
          });

          const itemFinish = soRecord.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_wood_finish',
          });

          if (
            itemFinish !== 'Unfinished' &&
            itemFinish !== null &&
            itemFinish !== undefined &&
            itemFinish !== ''
          ) {
            finish['Item Finishes'] = itemFinish;
            finish['Quantity'] = itemQty;
            data.push(finish);
          }
        }
      }
      log.debug(strLoggerTitle + ' Array Of Objects', data);
      /* ------------------------- Read Each Line - End ------------------------- */
      //
      if (data.length) {
        /* ------------------------ Group of Finishes - Begin ----------------------- */
        let result = {};

        for (let i = 0; i < data.length; i++) {
          let itemFinish = data[i]['Item Finishes'];
          let quantity = data[i]['Quantity'];

          if (result[itemFinish]) {
            result[itemFinish] += quantity;
          } else {
            result[itemFinish] = quantity;
          }
        }
        /* ------------------------ Group of Finishes - End ----------------------- */
        //
        /* ------------------------ Insert New Items - Begin ------------------------ */
        // Get Touch Up Calculation Results
        const touchUpCalculationsResults = touchUpCalculationsRecords();
        log.debug(
          strLoggerTitle + ' Touch Up Calcualtion Results',
          touchUpCalculationsResults
        );
        //
        Object.entries(result).forEach(([key, value]) => {
          const itemQuantity = value;
          const itemFinish = key;
          let quantityMeasure;

          // Get Quantity Measure
          for (
            let index1 = 0;
            index1 < touchUpCalculationsResults.length;
            index1++
          ) {
            const minQuantity = touchUpCalculationsResults[index1].getValue(
              'custrecord_dm_min_quantity'
            );
            const maxQuantity = touchUpCalculationsResults[index1].getValue(
              'custrecord_dm_max_quantity'
            );
            if (
              Number(itemQuantity) > minQuantity &&
              Number(itemQuantity) < maxQuantity
            ) {
              quantityMeasure = touchUpCalculationsResults[index1].getValue(
                'custrecord_dm_qty_measurements'
              );
              break;
            }
          }
          //
          const itemDescription =
            itemFinish + ', ' + itemQuantity + ', ' + quantityMeasure;
          log.debug(strLoggerTitle + ' Item Description', itemDescription);
          //
          soRecord.selectNewLine({
            sublistId: 'item',
          });
          soRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            value: 1046,
          });
          soRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'amount',
            value: 1,
          });
          soRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            value: 1,
          });
          soRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            value: 1,
          });
          soRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'description',
            value: itemDescription,
          });
          soRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_dm_sales_order_notes',
            value: itemDescription,
          });
          soRecord.commitLine({ sublistId: 'item' });
        });
        /* ------------------------- Insert New Items - End ------------------------- */
        //
        soRecord.save();
      }
    } catch (error) {
      log.error(strLoggerTitle + ' caught an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>---------------- ' + strLoggerTitle + ' - Exit----------------<|'
    );
  };
  /* ---------------------------- After Submit - End --------------------------- */
  //
  /* ----------------------- Internal Functions - Begin ----------------------- */
  //
  /* ************************* Populate Dates - Begin ************************* */
  /**
   *
   * @param {object} context
   * @returns {boolean} true
   */
  const populateDates = (context) => {
    const strLoggerTitle = 'Populate Dates';

    log.debug(strLoggerTitle, '|>--------------Entry--------------<|');

    log.audit(
      strLoggerTitle,
      `RUNTIME EXECUTION CONTEXT: ${runtime.executionContext} USEREVENT TYPE: ${context.type}`
    );

    try {
      if (
        runtime.executionContext !== runtime.executionContext.USER_INTERFACE &&
        context.type === context.UserEventType.XEDIT
      ) {
        // Get date and set in mm/dd/yyy
        let currentDate = dateNow();
        currentDate = format.parse({
          value: currentDate,
          type: format.Type.DATE,
        });
        //
        const currentRecord = context.newRecord;
        // Job Status
        const jobStatus = currentRecord.getValue({
          fieldId: 'custbody_job_status',
        });
        //
        // Set Dates
        //13 -07 Ship Staged
        if (jobStatus === '13') {
          currentRecord.setValue({
            fieldId: 'custbody_dm_prod_end_date',
            value: currentDate,
          });
        }
        //14 - 08 Completed
        else if (jobStatus === '14') {
          currentRecord.setValue({
            fieldId: 'custbody_dm_completion_date',
            value: currentDate,
          });
        }
        //
      }
    } catch (error) {
      log.error(strLoggerTitle + ' caught an exception', error);
    }
    log.debug(strLoggerTitle, '|>--------------Exit--------------<|');
    //
    return true;
  };
  /* ************************* Populate Dates - End ************************* */
  //
  /* ************************* Get Date Now - Begin ************************* */
  /**
   *
   * @returns {date}
   */
  const dateNow = () => {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1;
    var yyyy = today.getFullYear();
    // change the format depending on the date format preferences set on your account
    today = mm + '/' + dd + '/' + yyyy;
    return today;
  };
  /* ************************* Get Date Now - End ************************* */
  //
  /* ************************* LineLevelCalculation - Begin ************************* */
  /**
   *
   * @param {object} tranRec
   * @returns {boolean}
   */
  const lineLevelCalculation = (tranRec) => {
    const strLoggerTitle = 'Line Level Calcualtion';
    let netsuiteQuantity = 0;

    log.debug(strLoggerTitle, '|>--------------Entry--------------<|');
    //
    try {
      let totalLines = 0;

      // Get Line Count
      const itemLineCount = tranRec.getLineCount({ sublistId: 'item' });
      for (let index = 0; index < itemLineCount; index++) {
        // Item ID
        const itemId = tranRec.getSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          line: index,
        });
        //
        // If Item ID not null
        if (itemId) {
          log.debug(strLoggerTitle + ' Line Level', `Item ID: ${itemId}`);

          // Item Type
          const itemType = tranRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'itemtype',
            line: index,
          });
          log.debug(strLoggerTitle + ' Line Level', `Item Type: ${itemType}`);
          if (itemType == 'Assembly') {
            totalLines += 1;
          }
          //

          //Price Display
          const priceDisplay = tranRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'price_display',
            line: index,
          });
          log.debug(
            strLoggerTitle + ' Line Level',
            `Price Display: ${priceDisplay}`
          );
          if (priceDisplay !== 'Custom') {
            tranRec.setSublistValue({
              sublistId: 'item',
              fieldId: 'price',
              value: -1,
              line: index,
            });
            tranRec.setSublistValue({
              sublistId: 'item',
              fieldId: 'pricelevels',
              value: -1,
              line: index,
            });
            tranRec.setSublistValue({
              sublistId: 'item',
              fieldId: 'rate',
              value: 1,
              line: index,
            });
          }
          //

          // Sell Quantity
          const sellQuantity = tranRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_dm_sell_qty',
            line: index,
          });
          log.debug(
            strLoggerTitle + ' Line Level',
            `Sell Quantity: ${sellQuantity}`
          );
          //

          // Face Width
          const faceWidth = tranRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_dm_fd_exp_face_width',
            line: index,
          });
          log.debug(strLoggerTitle + ' Line Level', `Face Width: ${faceWidth}`);
          //

          // Sell UOM
          const sellUOM = tranRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_dm_sell_uom',
            line: index,
          });
          log.debug(strLoggerTitle + ' Line Level', `Sell UOM: ${sellUOM}`);
          //

          // Get Nominal Thickness, Nominal Width, Raw Nominal Thickness, Raw Nominal Width,Finished Dimensions
          const nominalThickness = tranRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_nominal_thickness',
            line: index,
          });
          const nominalWidth = tranRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_nominal_width',
            line: index,
          });
          const rawNominalThickness = tranRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_dm_raw_nom_thick',
            line: index,
          });
          const rawNominalWidth = tranRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_dm_raw_nom_width',
            line: index,
          });
          const finishedDimesnions = tranRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_dm_fd_thickness',
            line: index,
          });
          log.debug(
            strLoggerTitle + ' Line Level',
            `Nominal Thickness: ${nominalThickness}, Nominal Width:${nominalWidth} Raw Nominal Thickness:${rawNominalThickness}
            Raw Nominal Width: ${rawNominalWidth} Finished Dimension:${finishedDimesnions}`
          );
          //
          const isLinearFeet =
            sellQuantity > 0 &&
            sellUOM == '1' &&
            nominalThickness > 0 &&
            nominalWidth > 0 &&
            rawNominalThickness > 0 &&
            rawNominalWidth > 0;

          const isSquareFeet =
            sellQuantity > 0 &&
            sellUOM == '2' &&
            nominalThickness > 0 &&
            nominalWidth > 0 &&
            rawNominalThickness > 0 &&
            rawNominalWidth > 0 &&
            faceWidth > 0;
          //
          /* ---------------------------- Setting Quantity - Begin ---------------------------- */
          // Netsuite Quantity Calculation based on Linear Feet/ Square Feet / Each
          if (isLinearFeet) {
            netsuiteQuantity =
              sellQuantity *
              (nominalThickness / rawNominalThickness) *
              (nominalWidth / rawNominalWidth);
            log.audit(
              strLoggerTitle + ' Line Level',
              `Units are linear feet Netsuite Quantity: ${netsuiteQuantity}`
            );
            // Set Netsuite Quantity
            tranRec.setSublistValue({
              sublistId: 'item',
              fieldId: 'quantity',
              value: netsuiteQuantity.toFixed(1),
              line: index,
            });
          } else if (isSquareFeet) {
            netsuiteQuantity =
              (12 / faceWidth) *
              sellQuantity *
              (nominalThickness / rawNominalThickness) *
              (nominalWidth / rawNominalWidth);
            log.audit(
              strLoggerTitle + ' Line Level',
              `Units are Square feet Netsuite Quantity: ${netsuiteQuantity}`
            );
            // Set Netsuite Quantity
            tranRec.setSublistValue({
              sublistId: 'item',
              fieldId: 'quantity',
              value: netsuiteQuantity.toFixed(1),
              line: index,
            });
          } else {
            log.audit(strLoggerTitle + ' Line Level', `Units are Each`);
            netsuiteQuantity = sellQuantity;
            tranRec.setSublistValue({
              sublistId: 'item',
              fieldId: 'quantity',
              value: netsuiteQuantity,
              line: index,
            });
          }
          /* ---------------------------- Setting Quantity - End ---------------------------- */
          //
          const sellRate = tranRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_dm_sell_rate',
            line: index,
          });
          const sellAmount = sellQuantity * sellRate;

          tranRec.setSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_dm_sell_amount',
            value: sellAmount,
            line: index,
          });
          //
          /* -------------------------- Setting Rate & Amount - Begin -------------------------- */
          const isNetsuiteQuantity =
            sellAmount > 0 &&
            priceDisplay.toLowerCase() == 'custom' &&
            netsuiteQuantity > 0;
          if (isNetsuiteQuantity) {
            const netsuiteRate = (sellAmount / netsuiteQuantity).toFixed(2);
            log.audit(
              strLoggerTitle + ' Line Level',
              `Netsuite Rate ${netsuiteRate}`
            );
            //
            tranRec.setSublistValue({
              sublistId: 'item',
              fieldId: 'rate',
              value: netsuiteRate,
              line: index,
            });
            tranRec.setSublistValue({
              sublistId: 'item',
              fieldId: 'amount',
              value: sellAmount,
              line: index,
            });
          }

          if (itemType !== 'Assembly' || itemType !== 'InvtPart') {
            tranRec.setSublistValue({
              sublistId: 'item',
              fieldId: 'amount',
              value: sellAmount,
              line: index,
            });
          }
          /* -------------------------- Setting Rate & Amount - End -------------------------- */
          //
          // Set Default to Location
          tranRec.setSublistValue({
            sublistId: 'item',
            fieldId: 'location',
            value: 2,
            line: index,
          });
          //
          const quantity = tranRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            line: index,
          });

          if (quantity > 0 && faceWidth > 0 && finishedDimesnions) {
            // Linear Feet
            if (sellUOM == '1') {
              tranRec.setSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_dm_linear_feet',
                value: sellQuantity,
                line: index,
              });
              const totalSquareFeet = (faceWidth / 12) * sellQuantity;
              tranRec.setSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_dm_total_square_feet',
                value: totalSquareFeet.toFixed(2),
                line: index,
              });
              log.audit(
                strLoggerTitle + ' LineLevel',
                `Units is Linear Feet TotalLinearFeet:${sellQuantity} TotalSquareFeet:${totalSquareFeet}`
              );
            }
            // Square Feet
            else if (sellUOM == '2') {
              tranRec.setSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_dm_total_square_feet',
                value: sellQuantity,
                line: index,
              });
              const totalLinearFeet = (12 / faceWidth) * sellQuantity;
              tranRec.setSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_dm_linear_feet',
                value: totalLinearFeet.toFixed(2),
                line: index,
              });
              log.audit(
                strLoggerTitle + ' LineLevel',
                `Units is Square Feet TotalLinearFeet:${totalLinearFeet} TotalSquareFeet:${sellQuantity}`
              );
            }
            //
          }
          //
        }
        //
      }
      //
      tranRec.setValue({
        fieldId: 'custbody_dm_total_so_lines',
        value: totalLines,
      });
    } catch (error) {
      log.error(strLoggerTitle + ' caught an exception', error);
    }
    //
    log.debug(strLoggerTitle, '|>--------------Exit--------------<|');
    //
    return true;
  };
  /* ************************* LineLevelCalculation - End ************************* */
  //
  /* *********************** getAllSearchResults - Begin *********************** */
  /**
   *
   * @param {string} stRecordType
   * @param {string} stSavedSearch
   * @param {array} arrFilters
   * @param {array} arrColumns
   * @returns {array} array of objects
   */
  const getAllSearchResults = (
    stRecordType,
    stSavedSearch,
    arrFilters,
    arrColumns
  ) => {
    let arrResult = [];
    let searchResults;
    if (stSavedSearch) {
      searchResults = search.load({
        id: stSavedSearch,
        type: stRecordType,
      });
      for (let i = 0; arrColumns != null && i < arrColumns.length; i++) {
        searchResults.columns.push(arrColumns[i]);
      }
      for (let i = 0; arrFilters != null && i < arrFilters.length; i++) {
        searchResults.filters.push(arrFilters[i]);
      }
    } else {
      searchResults = search.create({
        type: stRecordType,
        columns: arrColumns,
        filters: arrFilters,
      });
    }

    let count = 1000;
    let init = true;
    let min = 0;
    let max = 1000;

    while (count === 1000 || init) {
      var resultSet = searchResults.run().getRange({
        start: min,
        end: max,
      });

      arrResult = arrResult.concat(resultSet);
      min = max;
      max += 1000;

      init = false;
      count = resultSet.length;
    }

    return arrResult;
  };
  /* *********************** getAllSearchResults - End *********************** */
  //
  /* *********************** touchUpCalculationsRecords - Begin *********************** */
  const touchUpCalculationsRecords = () => {
    const strLoggerTitle = ' Get Touch Up Calculations Records';
    log.debug(
      strLoggerTitle,
      '-------------<< ' + strLoggerTitle + ' - Entry >>-------------'
    );
    //
    // Filters
    const arrFilters = [];
    arrFilters.push(['isinactive', 'is', 'F']);
    //
    // Columns
    const arrColumns = [];
    arrColumns.push(
      search.createColumn({
        name: 'id',
        sort: search.Sort.ASC,
        label: 'ID',
      })
    );
    arrColumns.push(
      search.createColumn({
        name: 'custrecord_dm_min_quantity',
        label: 'Minimum Quantity',
      })
    );
    arrColumns.push(
      search.createColumn({
        name: 'custrecord_dm_max_quantity',
        label: 'Maximum Quantity',
      })
    );
    arrColumns.push(
      search.createColumn({
        name: 'custrecord_dm_qty_measurements',
        label: 'Quantity Measure',
      })
    );
    //
    // call the search
    const results = getAllSearchResults(
      'customrecord_dm_touchup_paintcalculation',
      null,
      arrFilters,
      arrColumns
    );
    log.debug(strLoggerTitle, 'Length of Results: ' + results.length);
    //
    log.debug(
      strLoggerTitle,
      '-------------<< ' + strLoggerTitle + ' - Exit >>-------------'
    );
    return results;
  };
  /* *********************** touchUpCalculationsRecords - End *********************** */
  //
  /* ----------------------- Internal Functions - End ----------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.beforeLoad = beforeLoad;
  exports.beforeSubmit = beforeSubmit;
  //exports.afterSubmit = afterSubmit;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
