/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
 define(['N/email', 'N/file', 'N/search', 'N/runtime', 'N/render', 'N/xml', 'N/record', 'N/format'
],
    /**
   * @param{email} email
   * @param{file} file
   * @param{search} search
   * @param{runtime} runtime
   * @param{render} render
   * @param{xml} xml
   * @param{record} record
   * @param{format} format
   */
    (email, file, search, runtime, render, xml, record, format) => {

        function escapeHtml(unsafe) {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        function nullCheck(value) {
            if (value != null && value != '' && value != undefined && value != 'NULL')
                return true;
            else
                return false;
        }

        const onRequest = (scriptContext) => {
            let linesheetSearch = search.load({
                id: "customsearch_item_test",
                type: "item"
            })
            let resultObj = {}
            const itemSearchPagedData = linesheetSearch.runPaged({ pageSize: 1000 });
            for (let i = 0; i < itemSearchPagedData.pageRanges.length; i++) {
                const itemSearchPage = itemSearchPagedData.fetch({ index: i });
                itemSearchPage.data.forEach((result) => {
                    const size = result.getValue({ name: 'custitem_bcc_size' });
                    const url = result.getValue({ name: 'custitem_image_url' });
                    const displayName = result.getValue({ name: 'displayname' });
                    const itemid = result.getValue({ name: 'itemid' });
                    const content = result.getValue({ name: 'custitem_bcc_default_textile_content' });
                    const retail = result.getValue({ name: 'baseprice' });
                    //log.debug('retail', retail);  
                    const ws = result.getValue({ name: 'price2' });
                    //log.debug('url', url);
                    var finalUrl = '';
                    if (url) {
                        var urlStartsWith = url.startsWith("https://6922326.app.netsuite.com");
                        //log.debug('urlStartsWith', urlStartsWith);
                       
                        if (urlStartsWith == false) {
                            //log.debug('False')
                            finalUrl = 'https://6922326.app.netsuite.com' + url
                        }
                        if (urlStartsWith == true) {
                            //log.debug('true')
                            finalUrl = url
                        }
                        finalUrl = escapeHtml(finalUrl)
                    }
                  
                    resultObj[itemid] = {
                        size: size,
                        test: finalUrl,
                        displayName: displayName,
                        itemid: itemid,
                        content: content,
                        retail: retail,
                        ws: ws
                    }

                });
            }
            log.debug("resultObj", resultObj)
            scriptContext.response.write(`<#assign data= ${JSON.stringify({ lines: resultObj })}>`);

        }


        return { onRequest: onRequest };
    });
