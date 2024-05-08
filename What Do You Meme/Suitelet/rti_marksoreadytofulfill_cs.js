/**
 * Module Description:
 *
 * Version			Date						Author					Remarks
 * 1.00					Jun 10, 2020						        Initial Version
 */

/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/search', 'N/record', 'N/currentRecord'], function (
  search,
  record,
  currentRecord
) {
  /**
   * Evaluate if the given string or object value is empty, null or
   * undefined.
   *
   */
  var isEmpty = function (stValue) {
    return (
      stValue === '' ||
      stValue == null ||
      stValue == undefined ||
      (stValue.constructor === Array && stValue.length == 0) ||
      (stValue.constructor === Object &&
        (function (v) {
          for (var k in v) return false;
          return true;
        })(stValue))
    );
  };

  /**
   * Function searching for invoices based on provided parameter
   * @function searchInvoices
   *
   * @param {Object}
   *            objSearch - search object
   * @return {Array}
   *            arrResult - invoices array
   */
  function searchInvoices(result, objSearch) {
    var stLogTitle = 'searchInvoices' + 'searchInvoices';
    log.debug(stLogTitle, '-- Entry --');
    var arrResult = [];

    // Run search
    //objSearch.run().each(function(element){
    result.data.forEach(function (element) {
      // log.debug(stLogTitle, 'element: ' + JSON.stringify(element));
      var objResultItem = {};
      objResultItem.id = element.id;

      //log.debug("objSearch.columns", objSearch.columns);

      objSearch.columns.forEach(function (column) {
        column = JSON.parse(JSON.stringify(column));

        // log.debug(stLogTitle, 'column.type: ' + column.type+' | ui.FieldType.SELECT: '+ui.FieldType.SELECT);

        if (column.type == 'select') {
          objResultItem[column.name] = element.getText(column);
        } else {
          objResultItem[column.name] = element.getValue(column);
        }
      });

      arrResult.push(objResultItem);
      return true;
    });

    log.debug(stLogTitle, '-- Exit --');

    return arrResult;
  }

  /**
   * Function to be executed after page is initialized.
   *
   * @param {Object} context
   * @param {Record} context.currentRecord - Current form record
   * @param {string} context.mode - The mode in which the record is being accessed (create, copy, or edit)
   *
   * @since 2015.2
   */
  function pageInit(context) {
    // jjf 2021.08.16
    window.onbeforeunload = null;
    console.log('Page init');
  }

  /**
   * Function to be executed when field is changed.
   *
   * @param {Object} context
   * @param {Record} context.currentRecord - Current form record
   * @param {string} context.sublistId - Sublist name
   * @param {string} context.fieldId - Field name
   * @param {number} context.lineNum - Line number. Will be undefined if not a sublist or matrix field
   * @param {number} context.columnNum - Line number. Will be undefined if not a matrix field
   *
   * @since 2015.2
   */
  function fieldChanged(context) {
    if (context.fieldId == 'custpage_search_line_list') {
      var pageNumber = context.currentRecord.getValue({
        fieldId: 'custpage_search_line_list',
      });
      var arrayOfColumns = JSON.parse(
        context.currentRecord.getValue({ fieldId: 'custpage_search_columns' })
      );
      //Libro funkce
      var objTranSearch = search.load({
        id: parseInt(
          context.currentRecord.getValue({ fieldId: 'custpage_search_object' })
        ),
      });

      var resultPaged = objTranSearch.runPaged();
      // Toto ziska pocet pages
      var pageCount = resultPaged.pageRanges.length;

      var r = resultPaged.fetch({
        index: pageNumber,
      });

      var a = 0;
      function retrievePage(resultPaged, pageIndex) {
        return resultPaged.fetch({
          index: pageIndex,
        });
      }

      console.log('Search Result', retrievePage(resultPaged, pageNumber));

      //Remove sublist lines and set new lines
      var lineNumber = context.currentRecord.getLineCount({
        sublistId: 'custpage_il_list',
      });

      //context.currentRecord.removeLine({sublistId:"custpage_il_list",line:0});

      if (lineNumber > 0) {
        for (var i = lineNumber; i > 0; i--) {
          //context.currentRecord.selectLine({sublistId:"custpage_il_list",line:i});
          context.currentRecord.removeLine({
            sublistId: 'custpage_il_list',
            line: i - 1,
          });
        }
      }

      //Set new result
      var fetchedResult = retrievePage(resultPaged, pageNumber);

      var arrInvoices = searchInvoices(fetchedResult, objTranSearch);

      console.log('ARRAY INVOICES', arrInvoices);

      //       // for each search result - invoice, insert line into the sublist

      var prefix = 'custpage_';
      var intCounter = 0;

      for (var i = 0; i < arrInvoices.length; i++) {
        debugger;
        var fieldName = Object.keys(arrInvoices[i]);

        context.currentRecord.selectNewLine({ sublistId: 'custpage_il_list' });

        for (var f = 0; f < fieldName.length; f++) {
          if (fieldName[f] == 'id') {
            context.currentRecord.setCurrentSublistText({
              sublistId: 'custpage_il_list',
              fieldId: 'custpage_internalid',
              text: arrInvoices[i][fieldName[f]],
            });
          } else {
            context.currentRecord.setCurrentSublistText({
              sublistId: 'custpage_il_list',
              fieldId: 'custpage_' + fieldName[f],
              text: arrInvoices[i][fieldName[f]],
            });
          }
        }

        context.currentRecord.commitLine({ sublistId: 'custpage_il_list' });
      }

      return true;
    }
  }

  /**
   * Validation function to be executed when sublist line is committed.
   *
   * @param {Object} context
   * @param {Record} context.currentRecord - Current form record
   * @param {string} context.sublistId - Sublist name
   *
   * @returns {boolean} Return true if sublist line is valid
   *
   * @since 2015.2
   */
  function validateLine(context) {
    console.log(
      'Line true or false',
      context.currentRecord.getCurrentSublistValue({
        sublistId: 'custpage_il_list',
        fieldId: 'custpage_select',
      })
    );
    if (
      context.currentRecord.getCurrentSublistValue({
        sublistId: 'custpage_il_list',
        fieldId: 'custpage_select',
      })
    ) {
      debugger;
      var arrayOfColumns = JSON.parse(
        context.currentRecord.getValue({ fieldId: 'custpage_search_columns' })
      );
      //Cycle through sublist

      var sublistLength = context.currentRecord.getLineCount({
        sublistId: 'custpage_il_list',
      });

      //Check if object exist
      var lineArrayFromField = JSON.parse(
        context.currentRecord.getValue({ fieldId: 'custpage_json_lines' })
      );

      console.log(
        'Line true or false',
        context.currentRecord.getCurrentSublistValue({
          sublistId: 'custpage_il_list',
          fieldId: 'custpage_select',
        })
      );

      var isIncluded = false;
      //Check the object
      if (lineArrayFromField.length == 0) {
        var lineObject = {
          lineKey:
            JSON.stringify(
              context.currentRecord.getCurrentSublistValue({
                sublistId: 'custpage_il_list',
                fieldId: 'custpage_line',
              })
            ) +
            JSON.stringify(
              context.currentRecord.getCurrentSublistValue({
                sublistId: 'custpage_il_list',
                fieldId: 'custpage_internalid',
              })
            ),
          transactionId: context.currentRecord.getCurrentSublistValue({
            sublistId: 'custpage_il_list',
            fieldId: 'custpage_internalid',
          }),
          orderallocationstrategy: context.currentRecord.getCurrentSublistValue(
            {
              sublistId: 'custpage_il_list',
              fieldId: 'custpage_allocation_strategy',
            }
          ),
        };

        for (var i = 0; i < arrayOfColumns.length; i++) {
          lineObject[arrayOfColumns[i]] =
            context.currentRecord.getCurrentSublistValue({
              sublistId: 'custpage_il_list',
              fieldId: 'custpage_' + [arrayOfColumns[i]],
            });
        }

        lineArrayFromField.push(lineObject);
        context.currentRecord.setValue({
          fieldId: 'custpage_json_lines',
          value: JSON.stringify(lineArrayFromField),
        });
        console.log('lineObject', JSON.stringify(lineObject));
        isIncluded = true;
      } else {
        // for (var i = 0; i < lineArrayFromField.length; i++) {
        //   console.log("line array from field " + lineArrayFromField[i], "Line Item internal id", context.currentRecord.getCurrentSublistValue({sublistId:"custpage_il_list",fieldId:"custpage_internalid"}));
        //   console.log("line", "Line Item internal id", context.currentRecord.getCurrentSublistValue({sublistId:"custpage_il_list",fieldId:"custpage_line"}));
        //
        //   if (lineArrayFromField[i].lineKey == context.currentRecord.getCurrentSublistValue({sublistId:"custpage_il_list",fieldId:"custpage_lineuniquekey"})) {
        //     lineArrayFromField.splice(0, i+1);
        //     console.log("lineArrayFromField - spliced", lineArrayFromField);
        //     context.currentRecord.setValue({fieldId:"custpage_json_lines",value:JSON.stringify(lineArrayFromField)});
        //     console.log("Line Removed");
        //     isIncluded = true;
        //     break;
        //   }
        //
        // }

        if (!isIncluded) {
          var lineObject = {
            lineKey:
              JSON.stringify(
                context.currentRecord.getCurrentSublistValue({
                  sublistId: 'custpage_il_list',
                  fieldId: 'custpage_line',
                })
              ) +
              JSON.stringify(
                context.currentRecord.getCurrentSublistValue({
                  sublistId: 'custpage_il_list',
                  fieldId: 'custpage_internalid',
                })
              ),
            transactionId: context.currentRecord.getCurrentSublistValue({
              sublistId: 'custpage_il_list',
              fieldId: 'custpage_internalid',
            }),
            orderallocationstrategy:
              context.currentRecord.getCurrentSublistValue({
                sublistId: 'custpage_il_list',
                fieldId: 'custpage_allocation_strategy',
              }),
          };

          for (var i = 0; i < arrayOfColumns.length; i++) {
            arrayOfColumns[i];

            lineObject[arrayOfColumns[i]] =
              context.currentRecord.getCurrentSublistValue({
                sublistId: 'custpage_il_list',
                fieldId: 'custpage_' + [arrayOfColumns[i]],
              });
          }

          lineArrayFromField.push(lineObject);
          context.currentRecord.setValue({
            fieldId: 'custpage_json_lines',
            value: JSON.stringify(lineArrayFromField),
          });
          console.log('lineObject', lineObject);
          console.log('Line not found in existing object, ');
        }
      }
    } else {
      debugger;
      var lineArrayFromField = JSON.parse(
        context.currentRecord.getValue({ fieldId: 'custpage_json_lines' })
      );
      for (var i = 0; i < lineArrayFromField.length; i++) {
        console.log(
          'line array from field ' + lineArrayFromField[i],
          'Line Item internal id',
          context.currentRecord.getCurrentSublistValue({
            sublistId: 'custpage_il_list',
            fieldId: 'custpage_internalid',
          })
        );
        console.log(
          'line',
          'Line Item internal id',
          context.currentRecord.getCurrentSublistValue({
            sublistId: 'custpage_il_list',
            fieldId: 'custpage_line',
          })
        );

        if (
          lineArrayFromField[i].lineKey ==
          JSON.stringify(
            context.currentRecord.getCurrentSublistValue({
              sublistId: 'custpage_il_list',
              fieldId: 'custpage_lineuniquekey',
            })
          ) +
            JSON.stringify(
              context.currentRecord.getCurrentSublistValue({
                sublistId: 'custpage_il_list',
                fieldId: 'custpage_internalid',
              })
            )
        ) {
          console.log('array splice index i', i);
          lineArrayFromField.splice(i, 1);
          console.log('lineArrayFromField - spliced', lineArrayFromField);
          context.currentRecord.setValue({
            fieldId: 'custpage_json_lines',
            value: JSON.stringify(lineArrayFromField),
          });
          console.log('Line Removed');
          break;
        }
      }
    }
    return true;
  }

  function selectAll(context) {
    var objRecord = currentRecord.get();

    if (objRecord.getLineCount({ sublistId: 'custpage_il_list' }) > 0) {
      for (
        var x = 0;
        x < objRecord.getLineCount({ sublistId: 'custpage_il_list' });
        x++
      ) {
        objRecord.selectLine({
          sublistId: 'custpage_il_list',
          line: x,
        });

        objRecord.setCurrentSublistValue({
          sublistId: 'custpage_il_list',
          fieldId: 'custpage_select',
          value: true,
        });

        objRecord.commitLine({ sublistId: 'custpage_il_list' });
      }
    }
  }

  function deselectAll(context) {
    var objRecord = currentRecord.get();

    if (objRecord.getLineCount({ sublistId: 'custpage_il_list' }) > 0) {
      for (
        var x = 0;
        x < objRecord.getLineCount({ sublistId: 'custpage_il_list' });
        x++
      ) {
        objRecord.selectLine({
          sublistId: 'custpage_il_list',
          line: x,
        });

        objRecord.setCurrentSublistValue({
          sublistId: 'custpage_il_list',
          fieldId: 'custpage_select',
          value: false,
        });

        objRecord.commitLine({ sublistId: 'custpage_il_list' });
      }
    }
  }

  // jjf 2021.08.16
  function search() {
    var objCurrRec = currentRecord.get();

    var params = '&search=T';
    var customer = objCurrRec.getValue({ fieldId: 'custpage_filter_customer' });
    var datefrom = objCurrRec.getText({
      fieldId: 'custpage_filter_trandate_from',
    });
    var dateto = objCurrRec.getText({ fieldId: 'custpage_filter_trandate_to' });
    var suiteleturl = objCurrRec.getValue({ fieldId: 'custpage_suitelet_url' });

    if (customer) params += '&customer=' + customer;
    if (datefrom) params += '&datefrom=' + datefrom;
    if (dateto) params += '&dateto=' + dateto;

    console.log(
      'customer=' +
        customer +
        ', datefrom=' +
        datefrom +
        ', dateto=' +
        dateto +
        ', suiteleturl=' +
        suiteleturl
    );

    var lineCount = objCurrRec.getLineCount({ sublistId: 'custpage_il_list' });
    log.debug('Search Client Script', lineCount);

    window.location.href = suiteleturl + params;
  }

  return {
    pageInit: pageInit,
    fieldChanged: fieldChanged,
    selectAll: selectAll,
    deselectAll: deselectAll,
    validateLine: validateLine,
    search: search,
  };
});
