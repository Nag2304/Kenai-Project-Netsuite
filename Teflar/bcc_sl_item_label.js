/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */

define(['N/search', 'N/ui/serverWidget', 'N/render', 'N/file', 'N/record'], (
  search,
  serverWidget,
  render,
  file,
  record
) => {
  // var element;
  const onRequest = (params) => {
    try {
      var element = params.request.parameters;
      let action = element.action;
      let stock = element.stock;

      var renderer = render.create();

      // FORM 12

      const createForm12 = () => {
        try {
          var form = serverWidget.createForm({
            title: ' PDF 12',
          });

          form.addButton({
            id: 'custpage_print_pdf',
            label: 'Print PDF 12',
            functionName: 'createPDF12',
          });
          // form.addButton({
          //   id: "custpage_print_pdf",
          //   label: "Print ZPL 12",
          // });

          form.clientScriptModulePath = './BCC_CS_PrintItemLabel.js';
          params.response.writePage(form);
        } catch (error) {
          log.error('error in createForm', error.toString());
        }
      };

      const PrintPDF12 = (element) => {
        var xmlFile = file.load('SuiteScripts/BCC_ITEM_LABEL_GTIN12.xml');
        renderer.templateContent = xmlFile.getContents();

        const fieldLookUp = search.lookupFields({
          type: 'inventoryitem',
          id: element.internalid,
          columns: ['itemid', 'displayname', 'custitem_bcc_size', 'upccode'],
        });

        fieldLookUp.upccode = Math.trunc(fieldLookUp.upccode);
        log.debug('fieldLookup', fieldLookUp);

        renderer.addCustomDataSource({
          format: render.DataSource.OBJECT,
          alias: 'items',
          data: fieldLookUp,
        });
        var pdf = renderer.renderAsPdf();
        pdf.name = fieldLookUp.itemid;
        params.response.writeFile({ file: pdf, isInline: true });
      };

      //   if else statement

      if (action == 'form12') {
        createForm12();
      } else if (action == 'pdf12') {
        log.debug('element', element);
        PrintPDF12(element);
      }

      // // FORM 14

      const createForm14 = () => {
        try {
          var form = serverWidget.createForm({
            title: ' PDF 14',
          });

          form.addButton({
            id: 'custpage_print_pdf',
            label: 'Print PDF 14',
            functionName: 'createPDF14',
          });
          // form.addButton({
          //   id: "custpage_print_pdf",
          //   label: "Print ZPL 14",
          // });
          var primaryStock = form.addField({
            id: 'custpage_primary_stock_unit',
            label: 'Primary Stock Unit',
            type: serverWidget.FieldType.SELECT,
          });

          //   primaryStock.addSelectOption({
          //     value: "",
          //     text: "Select",
          //     isSelected: true,
          // })

          primaryStock.addSelectOption({
            value: '3',
            text: 'Cartons',
          });

          primaryStock.addSelectOption({
            value: '2',
            text: 'Pallets',
          });

          primaryStock.addSelectOption({
            value: '1',
            text: 'Pieces',
            isSelected: true,
          });

          form.clientScriptModulePath = './BCC_CS_PrintItemLabel.js';
          params.response.writePage(form);
        } catch (error) {
          log.error('error in createForm', error.toString());
        }
      };

      const PrintPDF14 = (element) => {
        var xmlFile = file.load('SuiteScripts/BCC_ITEM_LABEL_GTIN14.xml');
        renderer.templateContent = xmlFile.getContents();

        const fieldLookUp = search.lookupFields({
          type: 'inventoryitem',
          id: element.internalid,
          columns: [
            'itemid',
            'displayname',
            'custitem_bcc_size',
            'custitem5',
            'custitem_pcs',
          ],
        });

        if (fieldLookUp.custitem5 == '') {
          fieldLookUp.custitem5 = '0';
        }

        if (fieldLookUp.custitem_pcs == '') {
          fieldLookUp.custitem_pcs = '0';
        }

        renderer.addCustomDataSource({
          format: render.DataSource.OBJECT,
          alias: 'items',
          data: fieldLookUp,
        });

        log.debug('fieldLookUp', fieldLookUp);

        var pdf = renderer.renderAsPdf();
        pdf.name = fieldLookUp.itemid;
        params.response.writeFile({ file: pdf, isInline: true });
      };

      //   if else statement

      if (action == 'form14') {
        createForm14();
      } else if (action == 'pdf14') {
        PrintPDF14(element);
      }
    } catch (error) {
      log.debug('Error in onRequest', error);
    }
  };

  return {
    onRequest: onRequest,
  };
});
