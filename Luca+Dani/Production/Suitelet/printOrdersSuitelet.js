/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
 const CONFIG_FILE = "Picking Ticket Config/Orders Printed (Do not delete).txt"
 define(['N/record', 'N/search', 'N/render', 'N/file', 'N/task'], 
     function (record, search, render, file, task) {
     function onRequest(context) {
         try {
             var recordIds = context.request.parameters["records"].split(",")
             var isSummary = context.request.parameters["summary"]
             var formType = context.request.parameters["formType"]
             var processType = context.request.parameters["markorders"]
 
             var records = []
             var itemSummary = []
             var htmlTemplateFile = undefined
             var data = {}
 
             var renderer = render.create()
//             log.debug("processType", processType);
//             log.debug("processType != null", processType != null)
             
             if (processType != null) {
                 log.debug('records',records);
                 fillFile(recordIds)
                 recordIds.forEach(function (recordObj) {
                     var id = record.submitFields({
                         type: 'salesorder',
                         id: recordObj,
                         values: {
                             custbody_printed_ticket: true
                         }
                     })
                     log.debug("recObj", recordObj + " " + id)
                 });
             } else {
                 var salesOrders = searchRecords(recordIds)
                 
                 salesOrders.forEach(function (saleOrder) {
    
                    records.push(getObject(saleOrder))
                     // if (isSummary == 'T') {
                     //     itemSummary = pushItems(itemSummary, saleOrder)
                     // } else {
                     //     records.push(getObject(saleOrder))
                     // }
                 })
        
                 if (formType == "1" || formType == 1) {
//                    log.error('template', 'Templates/Picking Templates/pickECommerce.html' );
                    htmlTemplateFile = file.load("Templates/Picking Templates/pickECommerce.html")

                 } else {
//                    log.error('template', 'Templates/Picking Templates/pickWhole.html' );
                    htmlTemplateFile = file.load("Templates/Picking Templates/pickWhole.html")

                 }
 
                 try {
                    // sort records - start
                    var recordsSorted = [];
                    for (var r=0; r<recordIds.length; r++) {
                        var currentId = recordIds[r];
                        for (var o=0; o<records.length; o++) {
                            if (records[o].id == currentId) {
                                recordsSorted[recordsSorted.length] = records[o];
                            }
                        }
                    }
                    records = recordsSorted;
                    // sort records - end
                 } catch (E) {
                     log.error('Error - sorting records', E);
                 } 

                 data.records = records
                 // data.itemSummary = getItemSummaryArray(itemSummary)
                 data.date = dateFormatter(new Date())
 
                 renderer.templateContent = htmlTemplateFile.getContents()

                 log.debug('printing', 'data: ' + data);

                 renderer.addCustomDataSource({
                     format: render.DataSource.OBJECT,
                     alias: "data",
                     data: data,
                 })
                 context.response.addHeader({
                     name: 'Content-Type:',
                     value: 'application/pdf'
                 })
                 context.response.addHeader({
                     name: 'Content-Disposition',
                     value: 'inline; filename=”report.pdf”'
                 })
                 renderer.renderPdfToResponse(context.response)
               
               //call sched script to fulfill after printing
               var schedScriptTask = task.create({
                   taskType: task.TaskType.SCHEDULED_SCRIPT,
                   scriptId: 'customscript_fulfill_printed_orders',
                   deploymentId: 'customdeploy_fulfill_printed_orders'
               });                     
 
               var schedScriptTask = schedScriptTask.submit();
               var taskStatus = task.checkStatus(schedScriptTask);
               log.debug("schedScript taskStatus: ", taskStatus);                                
             }
 
         } catch (e) {
             log.debug("Error", "Error" + e)
         }
     }
     function fillFile(records) {
         log.debug("init")
         var fileObj = file.load(CONFIG_FILE)
         log.debug('fileObj', fileObj);
         var contents = fileObj.getContents()
         log.debug(contents)
         var formattedDate = (new Date().getMonth() + 1) + "/" + new Date().getDate() + "/" + new Date().getFullYear()
         if (contents.split("**\n")[0] != formattedDate) {
             contents = formattedDate + "**\n" + records.toString()
         }
         else contents += "," + records.toString()
         var fileName = fileObj.name
         var fileFolder = fileObj.folder
         file.delete(fileObj.id)
         fileObj = file.create({
             name: fileName,
             fileType: file.Type.PLAINTEXT,
             folder: fileFolder,
             contents: contents
         })
         fileObj.save()
     }
     function searchRecords(recordIds) {
         var recIds = ["internalid", "anyof"]
         recordIds.forEach(function (id) { recIds.push(id) })
         var transactionSearchObj = search.create({
             type: "transaction",
             filters:
                 [
                     recIds,
                     "AND",
                     ["mainline", "is", "F"]/*,
                     "AND",
                     ["item.matrixchild", "is", "T"]*/,
                     "AND",
                     ["item.type", "anyof", "InvtPart", "Assembly"]
                 ],
             columns:
                 [
                     search.createColumn({ name: "internalid", label: "Internal ID" }),
                     search.createColumn({ name: "tranid", label: "Document Number" }),
                     search.createColumn({ name: "trandate", label: "Date" }),
                     search.createColumn({ name: "custbody_ld_recipient_name", label: "Recipient Name" }),
                     search.createColumn({ name: "custbody_ld_source", label: "Transaction Source"}), //ns_acs_pcr added line for transaction source
                     search.createColumn({ name: "custbody_ld_gift_note", label: "Gift Note" }),
                     search.createColumn({ name: "shipmethod", label: "Ship Via" }),
                     search.createColumn({ name: "custbody_celigo_shopify_discountcode", label: "Shopify Discount Code" }),
                     search.createColumn({ name: "custbody_ld_shopify_note", label: "Shopify Notes" }),
                     search.createColumn({ name: "otherrefnum", label: "Reference Number" }),
                     search.createColumn({ name: "billaddress", label: "Billing Address" }),
                     search.createColumn({ name: "shipaddress", label: "Shipping Address" }),
                     search.createColumn({ name: "custbody_printed_ticket", label: "Printed Picking Ticket (custom)" }),
                     search.createColumn({ name: "quantity", label: "Quantity" }),
                     search.createColumn({ name: "quantitycommitted", label: "Quantity Committed" }),
                     search.createColumn({ name: "rate", label: "Item Rate" }),
                     search.createColumn({ name: "item", label: "Item" }),
                     search.createColumn({ name: "custcol_ld_stack_id", label: "Stack ID" }),
                     search.createColumn({
                         name: "salesdescription",
                         join: "item",
                         label: "Description"
                     }),
                     search.createColumn({
                         name: "custitem_ld_bin_reference",
                         join: "item",
                         label: "Bin Reference"
                     }),
                     search.createColumn({ name: "custcol_ld_personal_note", label: "Personalization Note" }),
                     search.createColumn({ name: "custcol4" }),


                     search.createColumn({ name: "custcolgift_note" }),

                     search.createColumn({ name: "custcolgiftsetfield1" }),
                     search.createColumn({ name: "custcolgiftsetfield2" }),
                     search.createColumn({ name: "custcolcustcolgiftsetfield3" }),
                     
                     search.createColumn({ name: "custcolcustcolgiftset1sku" }),
                     search.createColumn({ name: "custcolcustcolgiftset2sku" }),
                     search.createColumn({ name: "custcolcustcolcustcolgiftset3sku" }),
        
                     search.createColumn({ name: "custcoluploadedimage1" }),
                     search.createColumn({ name: "custcoluploadedimage2" }),
                     search.createColumn({ name: "custcoluploadedimage3" }),


                     search.createColumn({ name: "custcolbirthstone_sku" }),
                     search.createColumn({ name: "custbodycard_message" })
                 ]
         });
         var searchResultCount = transactionSearchObj.runPaged().count;
         var orders = []
         if (searchResultCount < 900) {
             transactionSearchObj.run().each(function (result) {
                 if (!orderExists(orders, result.getValue("internalid")))
                     pushFullOrder(result, orders, transactionSearchObj)
                 else pushItem(orders, result.getValue("internalid"), {
                     id: result.getValue("item"),
                     name: result.getText("item"),
                     description: result.getValue(transactionSearchObj.columns[18]),
                     bin_reference: result.getText(transactionSearchObj.columns[19]),
                     personal_note: result.getValue("custcol_ld_personal_note"),

                     custcolgift_note: result.getValue("custcolgift_note"),

                     custcolgiftsetfield1: result.getValue("custcolgiftsetfield1"),
                     custcolgiftsetfield2: result.getValue("custcolgiftsetfield2"),
                     custcolcustcolgiftsetfield3: result.getValue("custcolcustcolgiftsetfield3"),
                     
                     custcolcustcolgiftset1sku: result.getValue("custcolcustcolgiftset1sku"),
                     custcolcustcolgiftset2sku: result.getValue("custcolcustcolgiftset2sku"),
                     custcolcustcolcustcolgiftset3sku: result.getValue("custcolcustcolcustcolgiftset3sku"),
        
                     custcoluploadedimage1: result.getValue("custcoluploadedimage1"),
                     custcoluploadedimage2: result.getValue("custcoluploadedimage2"),
                     custcoluploadedimage3: result.getValue("custcoluploadedimage3"),

                     rate: result.getValue("rate"),
                     quantity: result.getValue("quantity"),
                     commited: result.getValue("quantitycommitted"),
                     stack_id: result.getValue("custcol_ld_stack_id"),
                     custcol4: result.getValue("custcol4"),
                     custcolbirthstone_sku: result.getValue("custcolbirthstone_sku"),
                     card_message: result.getValue("custbodycard_message")
                 })
                 return true;
             });
         }
         else {
             for (i = 0; i < parseInt(searchResultCount / 900); i++) {
                 transactionSearchObj.run().getRange(i * 900, (i * 900) + 899).forEach(function (result) {
                     if (!orderExists(orders, result.getValue("internalid")))
                         pushFullOrder(result, orders, transactionSearchObj)
                     else pushItem(orders, result.getValue("internalid"), {
                         id: result.getValue("item"),
                         name: result.getText("item"),
                         description: result.getValue(transactionSearchObj.columns[18]),
                         bin_reference: result.getText(transactionSearchObj.columns[19]),
                         personal_note: result.getValue("custcol_ld_personal_note"),
                         rate: result.getValue("rate"),
                         quantity: result.getValue("quantity"),
                         commited: result.getValue("quantitycommitted"),
                         stack_id: result.getValue("custcol_ld_stack_id"),
                         custcol4: result.getValue("custcol4"),
                         custcolbirthstone_sku: result.getValue("custcolbirthstone_sku"),
                         card_message: result.getValue("custbodycard_message")
                     })
                 })
             }
             transactionSearchObj.run().getRange(searchResultCount - (parseInt(searchResultCount / 900) * 900), searchResultCount).forEach(function (result) {
                 if (!orderExists(orders, result.getValue("internalid")))
                     pushFullOrder(result, orders, transactionSearchObj)
                 else pushItem(orders, result.getValue("internalid"), {
                     id: result.getValue("item"),
                     name: result.getText("item"),
                     description: result.getValue(transactionSearchObj.columns[18]),
                     bin_reference: result.getText(transactionSearchObj.columns[19]),
                     personal_note: result.getValue("custcol_ld_personal_note"),
                     rate: result.getValue("rate"),
                     quantity: result.getValue("quantity"),
                     commited: result.getValue("quantitycommitted"),
                     stack_id: result.getValue("custcol_ld_stack_id"),
                     custcol4: result.getValue("custcol4"),
                     custcolbirthstone_sku: result.getValue("custcolbirthstone_sku"),
                     card_message: result.getValue("custbodycard_message")
                 })
             })
         }
         return orders
     }
     function pushFullOrder(result, orders, searchObj) {
         orders.push({
             id: result.getValue("internalid"),
             tranid: result.getValue("tranid"),
             trandate: result.getValue("trandate"),
             recip_name: result.getValue("custbody_ld_recipient_name"),
             trans_source: result.getText('custbody_ld_source'),
             gift_note: result.getValue("custbody_ld_gift_note"),
             ship_method: result.getText("shipmethod"),
             shopify_discount: result.getValue("custbody_celigo_shopify_discountcode"),
             shopify_note: result.getValue("custbody_ld_shopify_note"),
             custbodycard_message: result.getValue("custbodycard_message"),
             ref_number: result.getValue("otherrefnum"),
             billing_address: result.getValue("billaddress"),
             shipping_address: result.getValue("shipaddress"),
             printed_ticket: result.getValue("custbody_printed_ticket"),
             items: [{
                 id: result.getValue("item"),
                 name: result.getText("item"),
                 description: result.getValue(searchObj.columns[18]),
                 bin_reference: result.getText(searchObj.columns[19]),
                 personal_note: result.getValue("custcol_ld_personal_note"),
                 rate: result.getValue("rate"),
                 quantity: result.getValue("quantity"),
                 commited: result.getValue("quantitycommitted"),
                 stack_id: result.getValue("custcol_ld_stack_id"),
                 custcol4: result.getValue("custcol4"),
                 custcolbirthstone_sku: result.getValue("custcolbirthstone_sku"),
                 card_message: result.getValue("custbodycard_message"),

                 custcolgift_note: result.getValue("custcolgift_note"),

                 custcolgiftsetfield1: result.getValue("custcolgiftsetfield1"),
                 custcolgiftsetfield2: result.getValue("custcolgiftsetfield2"),
                 custcolcustcolgiftsetfield3: result.getValue("custcolcustcolgiftsetfield3"),
                 
                 custcolcustcolgiftset1sku: result.getValue("custcolcustcolgiftset1sku"),
                 custcolcustcolgiftset2sku: result.getValue("custcolcustcolgiftset2sku"),
                 custcolcustcolcustcolgiftset3sku: result.getValue("custcolcustcolcustcolgiftset3sku"),

                 custcoluploadedimage1: result.getValue("custcoluploadedimage1"),
                 custcoluploadedimage2: result.getValue("custcoluploadedimage2"),
                 custcoluploadedimage3: result.getValue("custcoluploadedimage3")

             }]
         })
     }
     function pushItem(orders, orderId, itemObj) {
         orders.forEach(function (order) {
             if (order.id == orderId) {
                 order.items.push(itemObj)
                 return;
             }
 
         })
     }
     function orderExists(orders, orderId) {
         var exists = false;
         orders.forEach(function (order) {
             if (order.id == orderId) exists = true
         })
         return exists
     }
     function getItemSummaryArray(itemSummary) {
         returnArray = []
         keysArray = Object.keys(itemSummary)
         for (var i = 0; i < keysArray.length; i++) {
             returnArray.push(itemSummary[keysArray[i]])
         }
         return returnArray
     }
     function pushItems(itemSummary, saleOrder) {
         itemLines = saleOrder.items.length
         for (var k = 0; k < itemLines; k++) {
 
             var itemName = saleOrder.items[k].name
             if (itemName.indexOf(" : ") > -1) itemName = itemName.substring(itemName.indexOf(" : ") + 3, itemName.length)
             key = "" + itemName
             qty = parseInt(saleOrder.items[k].quantity)
             description = saleOrder.items[k].description
             custcol_ld_bin_reference = saleOrder.items[k].bin_reference
             if (itemSummary.hasOwnProperty(key)) {
                 itemSummary[key].quantity = itemSummary[key].quantity + qty
             } else {
                 var obj = {}
                 obj.quantity = qty
                 obj.item = key
                 obj.description = description
                 obj.custcol_ld_bin_reference = custcol_ld_bin_reference
                 itemSummary[key] = obj
             }
 
         }
         return itemSummary
     }
     function getObject(saleOrder) {
         var obj = {}
         obj.printed_ticket = saleOrder.printed_ticket
         obj.id = saleOrder.id
         obj.tranid = saleOrder.tranid
         obj.trandate = dateFormatter(new Date(saleOrder.trandate))
         obj.custbody_ld_recipient_name = saleOrder.recip_name
         obj.custbody_ld_source = saleOrder.trans_source
         obj.custbody_ld_gift_note = saleOrder.gift_note
         obj.shipmethod = saleOrder.ship_method.replace("&", "&amp;")
         obj.card_message = saleOrder.custbodycard_message
         obj.custbody_celigo_shopify_discountcode = saleOrder.shopify_discount.replace("&", "&amp;")
         obj.custbody_ld_shopify_note = saleOrder.shopify_note.replace("&", "&amp;")
         obj.otherrefnum = saleOrder.ref_number.replace("&", "&amp;")
         obj.billaddressee = saleOrder.billing_address.split("\n")[0].replace("&", "&amp;");
         obj.shipaddress = saleOrder.shipping_address.replace(/\n/g, '<br></br>').replace("&", "&amp;");
         obj.item = []
 
         itemLines = saleOrder.items.length
         for (var k = 0; k < itemLines; k++) {
             var subObj = {}
             var itemName = saleOrder.items[k].name
             if (itemName.indexOf(" : ") > -1) itemName = itemName.substring(itemName.indexOf(" : ") + 3, itemName.length)
             subObj.item = itemName
             subObj.description = saleOrder.items[k].description.replace("&", "&amp;")
             subObj.custcol_ld_stack_id = saleOrder.items[k].stack_id//.replace("&", "&amp;")
             subObj.quantity = saleOrder.items[k].quantity
             subObj.custcol_ld_bin_reference = saleOrder.items[k].bin_reference
             subObj.rate = saleOrder.items[k].rate
             subObj.quantitycommitted = saleOrder.items[k].commited
             subObj.custcol_ld_personal_note = saleOrder.items[k].personal_note.replace("&", "&amp;")
             subObj.custcol4 = saleOrder.items[k].custcol4
             subObj.custcolbirthstone_sku = saleOrder.items[k].custcolbirthstone_sku
             subObj.custbodycard_message = saleOrder.items[k].custbodycard_message

             subObj.custcolgift_note = saleOrder.items[k].custcolgift_note.replace("&", "&amp;").replace("&", "&amp;")

             subObj.custcolgiftsetfield1 = saleOrder.items[k].custcolgiftsetfield1.replace("&", "&amp;").replace("&", "&amp;")
             subObj.custcolgiftsetfield2 = saleOrder.items[k].custcolgiftsetfield2.replace("&", "&amp;").replace("&", "&amp;")
             subObj.custcolcustcolgiftsetfield3 = saleOrder.items[k].custcolcustcolgiftsetfield3.replace("&", "&amp;").replace("&", "&amp;")

             subObj.custcolcustcolgiftset1sku = saleOrder.items[k].custcolcustcolgiftset1sku.replace("&", "&amp;").replace("&", "&amp;")
             subObj.custcolcustcolgiftset2sku = saleOrder.items[k].custcolcustcolgiftset2sku.replace("&", "&amp;").replace("&", "&amp;")
             subObj.custcolcustcolcustcolgiftset3sku = saleOrder.items[k].custcolcustcolcustcolgiftset3sku.replace("&", "&amp;").replace("&", "&amp;")

             subObj.custcoluploadedimage1 = saleOrder.items[k].custcoluploadedimage1
             subObj.custcoluploadedimage2 = saleOrder.items[k].custcoluploadedimage2
             subObj.custcoluploadedimage3 = saleOrder.items[k].custcoluploadedimage3

             obj.item.push(subObj)
 
         }

         log.error('getObject', '*************************************************')
         log.error('getObject', obj)
         log.error('getObject', '*************************************************')

         return obj
     }
     function dateFormatter(date) {
         return (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear()
     }
     function checkItem(internalid) {
         var assemblyitemSearchObj = search.create({
             type: "assemblyitem",
             filters:
                 [
                     ["type", "anyof", "Assembly"],
                     "AND",
                     ["internalid", "anyof", internalid]/*,
                     "AND",
                     ["matrixchild", "is", "T"]*/
                 ],
             columns:
                 [
                     search.createColumn({ name: "internalid", label: "Internal ID" })
                 ]
         });
         var searchResultCount = assemblyitemSearchObj.runPaged().count;
         log.debug("assemblyitemSearchObj result count", searchResultCount);
         return searchResultCount > 0
     }
     return {
         onRequest: onRequest
     }
 })