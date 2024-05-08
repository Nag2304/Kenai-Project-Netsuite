/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */

/*global define,log*/

define(['N/ui/serverWidget', 'N/search'], (ui, search) => {
  /* ------------------------ Global variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global variables - End ------------------------- */
  //
  /* --------------------------- On Request - Begin --------------------------- */
  const onRequest = (context) => {
    const strLoggerTitle = 'On Request Begin';
    const request = context.request;
    const response = context.response;

    log.audit(
      strLoggerTitle,
      '|>---------------' + strLoggerTitle + ' - Begin---------------<|'
    );
    //
    try {
      // Create Form
      const form = ui.createForm({ title: 'Print Pro Forma Invoice' });
      //

      // Company Name filter
      const companyNameField = form.addField({
        id: 'custpage_company_name',
        type: ui.FieldType.TEXT,
        label: 'Company Name',
      });
      //

      form.addSubmitButton({
        label: 'Submit',
      });

      // Results sublist
      const resultsSublist = form.addSublist({
        id: 'custpage_results',
        type: ui.SublistType.LIST,
        label: 'Results',
      });

      // Checkbox field
      let checkboxField = resultsSublist.addField({
        id: 'custpage_checkbox',
        type: ui.FieldType.CHECKBOX,
        label: 'Check',
      });

      // Document Number field
      let docNumberFieldSublist = resultsSublist.addField({
        id: 'custpage_doc_number',
        type: ui.FieldType.TEXT,
        label: 'Document Number',
      });

      // Company Name field
      let companyNameFieldSublist = resultsSublist.addField({
        id: 'custpage_company_name',
        type: ui.FieldType.TEXT,
        label: 'Company Name',
      });

      resultsSublist.addMarkAllButtons();
      resultsSublist.addRefreshButton();

      form.clientScriptFileId = 41078;
      resultsSublist.addButton({
        id: 'custpage_printordersButton',
        label: 'Print',
        functionName: 'printOrders',
      });

      if (request.method == 'POST') {
        // Handle Post Request
        const companyName = request.parameters.custpage_company_name;
        log.audit(strLoggerTitle, companyName);
        //
        /* ----------------------------- Search - Begin ----------------------------- */
        if (companyName) {
          const filters = [];
          filters.push(['type', 'anyof', 'SalesOrd']);
          filters.push('AND');
          filters.push(['custbody_wdym_company_name', 'is', companyName]);
          filters.push('AND');
          filters.push(['mainline', 'is', 'T']);

          const columns = [];
          columns.push(
            search.createColumn({ name: 'tranid', label: 'Document Number' })
          );
          columns.push(
            search.createColumn({
              name: 'custbody_wdym_company_name',
              label: 'Company Name',
            })
          );
          const resultsObject = getAllSearchResults(
            'transaction',
            null,
            filters,
            columns
          );
          log.debug(strLoggerTitle, 'Results Length: ' + resultsObject.length);
          //
          for (let index = 0; index < resultsObject.length; index++) {
            // log.debug(
            //   strLoggerTitle,
            //   ' Tran ID' + resultsObject[index].getValue('tranid')
            // );
            const tranId = resultsObject[index].getValue('tranid');

            if (tranId) {
              resultsSublist.setSublistValue({
                id: 'custpage_doc_number',
                line: index,
                value: tranId,
              });
            }

            const companyName = resultsObject[index].getValue(
              'custbody_wdym_company_name'
            );

            if (companyName) {
              resultsSublist.setSublistValue({
                id: 'custpage_company_name',
                line: index,
                value: companyName,
              });
            }
          }
        }
        /* ----------------------------- Search - End ----------------------------- */
        //
      }
      response.writePage(form);
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>---------------' + strLoggerTitle + ' - End---------------<|'
    );
  };
  /* ---------------------------- On Request - End ---------------------------- */
  //
  /* --------------------- Get All Search Results - Begin --------------------- */
  function getAllSearchResults(
    stRecordType,
    stSavedSearch,
    arrFilters,
    arrColumns
  ) {
    var arrResult = [];
    var searchResults;
    if (stSavedSearch) {
      searchResults = search.load({
        id: stSavedSearch,
        type: stRecordType,
      });
      for (var i = 0; arrColumns != null && i < arrColumns.length; i++) {
        searchResults.columns.push(arrColumns[i]);
      }
      for (var i = 0; arrFilters != null && i < arrFilters.length; i++) {
        searchResults.filters.push(arrFilters[i]);
      }
    } else {
      searchResults = search.create({
        type: stRecordType,
        columns: arrColumns,
        filters: arrFilters,
      });
    }

    var count = 1000;
    var init = true;
    var min = 0;
    var max = 1000;

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
  }

  /* ---------------------- Get All Search Results - End ---------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.onRequest = onRequest;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
