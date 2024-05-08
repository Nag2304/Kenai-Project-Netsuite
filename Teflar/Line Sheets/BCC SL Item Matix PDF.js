/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
  'N/email',
  'N/file',
  'N/search',
  'N/runtime',
  'N/render',
  'N/xml',
  'N/record',
  'N/format',
], (email, file, search, runtime, render, xml, record, format) => {
  function nullCheck(value) {
    if (value != null && value != '' && value != undefined && value != 'NULL')
      return true;
    else return false;
  }

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  const onRequest = (scriptContext) => {
    // const scriptObj = runtime.getCurrentScript();

    // const numberOfPagesPerItem = scriptObj.getParameter({
    //   name: 'custscript_teflar_num_items_per_page',
    // });

    let matrixSearch = search.load({
      id: 'customsearch410',
      type: 'item',
    });

    let resultObj = {};
    let itemSearchPagedData;
    // if (numberOfPagesPerItem) {
    //   itemSearchPagedData = matrixSearch.runPaged({
    //     pageSize: numberOfPagesPerItem,
    //   });
    // } else {
    //   itemSearchPagedData = matrixSearch.runPaged({ pageSize: 1000 });
    // }
    itemSearchPagedData = matrixSearch.runPaged({ pageSize: 1000 });
    for (let i = 0; i < itemSearchPagedData.pageRanges.length; i++) {
      const itemSearchPage = itemSearchPagedData.fetch({ index: i });
      itemSearchPage.data.forEach((result) => {
        const finalSize = result.getValue({ name: 'custitem_bcc_size' });
        const Name = result.getValue({ name: 'itemid' });
        const displyName = result.getValue({ name: 'displayname' });
        const parent = result.getText({ name: 'parent' });
        //log.debug('parent', parent);
        const content = result.getValue({
          name: 'custitem_bcc_default_textile_content',
        });
        //log.debug('content', content);
        const retail = result.getValue({ name: 'baseprice' });
        //log.debug('retail', retail);
        const ws = result.getValue({ name: 'price2' });
        var imageUrl = result.getText({ name: 'custitem_bcc_item_image' });
        //log.debug('imageUrl B', imageUrl);
        var test = escapeHtml(imageUrl);
        //log.debug('test', test);

        if (!nullCheck(parent)) {
          if (!resultObj[Name]) {
            resultObj[Name] = {
              finalSize: finalSize,
              Name: Name,
              displyName: displyName,
              content: content,
              retail: retail,
              ws: ws,
              imageUrl: test,
            };
          }
        }
      });
    }
    log.debug('resultObj', resultObj);
    scriptContext.response.write(
      `<#assign data = ${JSON.stringify({ resultKey: resultObj })}>`
    );
  };

  return { onRequest: onRequest };
});
