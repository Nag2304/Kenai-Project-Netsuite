/*
Name           -   Send_EN_TO_BSR_UE_WebBee.js
Script Type    -   User Event
Purpose        -   Send REN to Primary BSR
Company        -   WebBee-ESolutions-PVT-LTD.
Created By     -   PRANJAL GOYAL
Client         -   HMS Marketing Services
Date           -   16th November 2016 - Live
Modified       -   8th May 2017
*/
var GHOST_LISTING_TYPE = 2;

var body = '';
var author = 4276;
var subject = 'HMS Marketing , REN UE';
var bcc = 'qschreiber@hmsmarketingservices.com';
var cc1 = 'jmcdonald@hmsmarketingservices.com';

var tmpBODY = 76;
var tmpFOOTER = 77;
var bsrTemplate = 82;
var smTemplate = 74;
//EST

var d1 = new Date();

function stdTimezoneOffset() {
    var jan = new Date(d1.getFullYear(), 0, 1);
    var jul = new Date(d1.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}

Date.prototype.dst = function() {
    return this.getTimezoneOffset() < stdTimezoneOffset();
}
nlapiLogExecution('DEBUG', 'this.stdTimezoneOffset()', stdTimezoneOffset());
nlapiLogExecution('DEBUG', 'this.getTimezoneOffset()', d1.getTimezoneOffset());

var today2 = new Date();
if (today2.dst()) {
    offset = -4.0

} else {
    offset = -5.0
}


clientDate = new Date();
utc = clientDate.getTime() + (clientDate.getTimezoneOffset() * 60000);

date = new Date(utc + (3600000 * offset));


//var date = new Date();
var dd = date.getDate();
var mm = date.getMonth() + 1;
var yy = date.getFullYear();
var today = mm + '/' + dd + '/' + yy;
var callCenter = 3847;
var CurrTime = nlapiDateToString(date, 'datetimetz');
var scriptId = 'customscript_ren_webbee_sch';
var deployId = 'customdeploy_ren_webbee_sch';
var propertyRecType = 'customrecord_property_record';
var SecretKey = nlapiLookupField('customrecord_auth_pass_phrase', 1, 'custrecord_secret_key');
var CFields = ['custevent_ren_session', 'custevent_builder_sales_rep_subd', 'custevent_linked_cases', 'status'];

function BeforeSubmit(type) {
    try {
        if (type == 'create' || type == 'edit') {
            var builder = nlapiGetFieldValue('company');
            //		if(builder=='3643'||builder=='3642')
            {
                var createCopy = nlapiGetFieldValue('custevent_create_copy');
                nlapiSetFieldValue('custevent_ren_session', createCopy);
            }
        }
    } catch (ex) {
        body = 'BeforeSubmit : ' + ex;
        body += ex.name + ' : ' + ex.message;
        nlapiSendEmail(author, bcc, subject, body);
        nlapiLogExecution('DEBUG', ' Body : ', body);
    }
}

function SendRENToBSR(type) {
    try {
        var CaseId = nlapiGetRecordId();
        if (defVal(CaseId) != '') {
      	    nlapiLogExecution('DEBUG', ' CaseId : ', CaseId);
            var builder = nlapiGetFieldValue('company');
            var CaseInfo = nlapiLookupField('supportcase', CaseId, CFields);
            var createApp = CaseInfo.custevent_ren_session;
            var primaryBSR = CaseInfo.custevent_builder_sales_rep_subd;
            var LinkedCaseId = CaseInfo.custevent_linked_cases;
            var status = CaseInfo.status;
            var oldCase = nlapiGetOldRecord();
          
            

            if ((type == 'edit' || type == 'xedit') && oldCase != null) {
                var oldStatus = oldCase.getFieldValue('status');
                if ((oldStatus != status) && defVal(LinkedCaseId) != '' && defVal(primaryBSR) != '') {
                    var filters = [];
                    filters.push(new nlobjSearchFilter('custevent_builder_sales_rep_subd', null, 'is', primaryBSR));
                    filters.push(new nlobjSearchFilter('custevent_linked_cases', null, 'is', LinkedCaseId));

                    var Search = nlapiSearchRecord('supportcase', null, filters);
                    if (Search != null && Search.length > 0) {
                        for (var j = 0; j < Search.length; j++)
                            nlapiSubmitField('supportcase', Search[j].getId(), 'status', status, true);
                    }
                } else
                    nlapiSubmitField('supportcase', CaseId, 'status', status, true);
            }

            if ((type == 'create' || type == 'edit') && createApp != 'T') {
                //              if(builder=='3643'||builder=='3642')
                {
                    var params = [];
                    params['custscript_caseid'] = CaseId;
                    var sch_status = nlapiScheduleScript(scriptId, deployId, params);
                    nlapiLogExecution('DEBUG', 'Script Scheduled', sch_status);

                    if (sch_status == "INPROGRESS" && type == 'create' ) {
                        try {
                            var bodyIP = "The Appointment tried to schedule the emails when the process was already running.\n Please verify that it was done and the emails were sent correctly.";
                            var subjectIP = 'Check New Inquiry Emails: ' + CaseId;
                            var recipientIP = ["jmcdonald@hmsmarketingservices.com","francisco.alvarado@midware.net"];
                            nlapiSendEmail(callCenter, recipientIP, subjectIP, bodyIP);
                        } catch (error) {
                            nlapiLogExecution('DEBUG', "INPROGRESS Email", error.message);
                        }

                    }

                }
            }
        }
    } // try block ends here..
    catch (ex) {
        body = 'SendRENToBSR : ' + ex;
        body += ex.name + ' : ' + ex.message;
        nlapiSendEmail(author, bcc, subject, body);
        nlapiLogExecution('DEBUG', ' Body : ', body);
    }
}


function SendRENSCH(type) {
    try {

        var context = nlapiGetContext();
        var CaseId = context.getSetting('SCRIPT', 'custscript_caseid');
        nlapiLogExecution('DEBUG', ' CaseId : ', CaseId);

        //        {
        //        	var SecretCode = SetPropertyForREN(CaseId);
        //        	var emailSubject = 'HMS Test';
        //		    var emailMerger = nlapiCreateEmailMerger(97); // Footer Email..
        //		    emailMerger.setSupportCase(CaseId);
        //		    var mergeResult = emailMerger.merge();
        //	        var emailBody = mergeResult.getBody();
        //	        
        //		    var emailBody_table = '';
        //	        var emailMerger_table = nlapiCreateEmailMerger(98); 
        //	        emailMerger_table.setSupportCase(CaseId);
        //		    var mergeResult_table = emailMerger_table.merge();
        //		    var eBody = mergeResult_table.getBody()
        //     	 	    eBody = eBody.replace('encryptId', defVal(SecretCode)); 
        //		    eBody=eBody.replace(/{/g, '<');
        //		    eBody=eBody.replace(/}/g, '>');
        //     	 	   
        //     		  emailBody_table+=eBody;
        //		    nlapiLogExecution('DEBUG', emailBody_table, emailBody_table);
        //		    data=data.replace('{propertyrequested}',emailBody_table);
        //		    emailBody=emailBody.replace('propertyrequested',data);
        //		    
        //	       	nlapiSendEmail(4276,'nd@webbee.biz',emailSubject,emailBody);
        //        }
        if (defVal(CaseId) != '') {
            nlapiSubmitField('supportcase', CaseId, 'custevent_ren_session', 'T', true);
            var BsrIds = [];
            var LCaseIds = [];
            var NLCaseIds = [];

            var filters = [];
            filters.push(new nlobjSearchFilter('custevent_bsr_notify_sent', null, 'is', 'F'));
            filters.push(new nlobjSearchFilter('custevent_ren_session', null, 'is', 'T'));
            filters.push(new nlobjSearchFilter('stage', null, 'is', 'OPEN'));
            filters.push(new nlobjSearchFilter('createddate', null, 'on', today));
            nlapiLogExecution('DEBUG', ' today : ', today);

            var columns = new nlobjSearchColumn('custevent_builder_sales_rep_subd', null, 'group');
            var cSearch = nlapiSearchRecord('supportcase', null, filters, columns);
            if (cSearch != null && cSearch.length > 0) {
                for (var i = 0; i < cSearch.length; i++)
                    BsrIds.push(cSearch[i].getValue(columns));
            }
            if (BsrIds != null && BsrIds.length > 0) {
                columns = new nlobjSearchColumn('custevent_linked_cases');
                for (var j = 0; j < BsrIds.length; j++) {
                    filters[4] = new nlobjSearchFilter('custevent_builder_sales_rep_subd', null, 'is', BsrIds[j]);
                    cSearch = nlapiSearchRecord('supportcase', null, filters, columns);

                    if (cSearch != null && cSearch.length > 0) {
                        var LCIds = [];
                        for (var i = 0; i < cSearch.length; i++) {
                            var caseId = cSearch[i].getId();
                            nlapiLogExecution('DEBUG', ' caseId : ', caseId);

                            var linkedCase = cSearch[i].getValue(columns);
                            if (defVal(linkedCase) != '')
                                LCIds.push(caseId);
                            else
                                NLCaseIds.push(caseId);
                        }
                        if (LCIds.length > 0)
                            LCaseIds.push(LCIds.join('='));
                    }
                }
            }
            body = 'NLCaseIds : ' + NLCaseIds + ', LCaseIds : ' + LCaseIds;
            nlapiLogExecution('DEBUG', ' Body : ', body);
            for (var i = 0; i < NLCaseIds.length; i++)
                ProcessREN([NLCaseIds[i]]);
            for (var i = 0; i < LCaseIds.length; i++)
                ProcessREN(LCaseIds[i].split('='));

        }
    } catch (ex) {
        body = 'SendRENSCH Q : ' + ex;
        body += ex.name + ' : ' + ex.message;
        nlapiSendEmail(author, bcc, subject, body);
        nlapiLogExecution('DEBUG', ' Body : ', body);
    }

}

function ProcessREN(CaseIds) {
    try {
        CheckGovernance();
        var file = nlapiLoadFile('39813');
        var data = file.getValue();
        var emailSubject = '';
        var emailMerger = nlapiCreateEmailMerger(97);
        emailMerger.setSupportCase(CaseIds[0]);
        var mergeResult = emailMerger.merge();
        var emailBody = mergeResult.getBody();
        nlapiLogExecution('DEBUG', '206');
        var emailBody_table = '';
        for (var i = 0; i < CaseIds.length; i++) {
            var SecretCode = SetPropertyForREN(CaseIds[i]);
            var emailMerger_table = nlapiCreateEmailMerger(98);
            emailMerger_table.setSupportCase(CaseIds[i]);
            var mergeResult_table = emailMerger_table.merge();
            var eBody = mergeResult_table.getBody()
            eBody = eBody.replace('encryptId', defVal(SecretCode));
            eBody = eBody.replace(/{/g, '<');
            eBody = eBody.replace(/}/g, '>');
            emailBody_table += eBody;

            CheckGovernance();
        }
        data = data.replace('{propertyrequested}', emailBody_table);
        emailBody = emailBody.replace('propertyrequested', data);
        nlapiLogExecution('DEBUG', '218');
        var CaseRec = nlapiLoadRecord('supportcase', CaseIds[0]);
        var renEnabled = CaseRec.getFieldValue('custevent_ren_enabled');
        var statusID = CaseRec.getFieldValue('status');
        var searchType = CaseRec.getFieldValue('custevent_subdivision_search');
        var builderSuppliedLead = CaseRec.getFieldValue('custevent_builder_lead');
        var topLevelBuilder = CaseRec.getFieldValue('custevent_builder');
        var subdivision = CaseRec.getFieldValue('custevent_subdivision_for_ren');
        var division = CaseRec.getFieldValue('company');
        var bsrNotifySent = CaseRec.getFieldValue('custevent_bsr_notify_sent');
        var agentName = CaseRec.getFieldValue('custevent_agent_for_ren');
        var salesManagerEmail = CaseRec.getFieldValue('custevent_sales_mgr_email');
        var divManagerEmail = CaseRec.getFieldValue('custeventdivision_mgr_email');
        var adminAsstEmail = CaseRec.getFieldValue('custevent_administrative_contact_email');
        var bsrID = CaseRec.getFieldValue('custevent_builder_sales_rep_subd');
        var bsrOneTimeOptOut = CaseRec.getFieldValue('custevent_one_time_rtan_opt_out');
        var smOptOut = CaseRec.getFieldValue('custevent_sm_opt_out');
        var dmOptOut = CaseRec.getFieldValue('custevent_dm_opt_out');
        var adminOptOut = CaseRec.getFieldValue('custevent_admin_opt_out');
        var smOptOutRTAN = CaseRec.getFieldValue('custevent_sm_opt_out_rtan');
        var dmOptOutRTAN = CaseRec.getFieldValue('custevent_dm_opt_out_rtan');
        var dmID = CaseRec.getFieldValue('custevent8');
        var smID = CaseRec.getFieldValue('custevent7');
        var adminOptOutRTAN = CaseRec.getFieldValue('custevent_admin_opt_out_rtan');
        var bsrOptOut = 'F'; // CaseRec.getFieldValue('custevent_bsr_opt_out');
        var stage = CaseRec.getFieldValue('stage');
        var callerType = CaseRec.getFieldValue('custevent_caller_type');
        var imageurl = '';
        try {
            var imageid = nlapiLookupField('customer', division, 'image');
            if (!imageid) {
                var builder_parent = nlapiLookupField('customer', division, 'parent');
                imageid = nlapiLookupField('customer', builder_parent, 'image');
                nlapiLogExecution('debug', 'builder_parent', builder_parent);
                image_file = nlapiLoadFile(imageid);
                imageurl = image_file.getURL();
            } else {
                var image_file = nlapiLoadFile(imageid);
                imageurl = image_file.getURL();
            }
        } catch (ier) {
            nlapiLogExecution('debug', 'err image', ier);
        }
        if (imageurl == '') {
            imageurl = 'https://1309901.app.netsuite.com/core/media/media.nl?id=39790&amp;c=1309901&amp;h=48dbf824375dd894c511';
        } else {
            imageurl = 'https://1309901.app.netsuite.com' + imageurl;
        }
        nlapiLogExecution('debug', 'url', imageurl);
        emailBody = emailBody.replace('logoimage', imageurl);
        var bsr_email = {};
        nlapiLogExecution('DEBUG', '301', division);
        try {
            if (callerType == '10' || callerType == '3') {
                var bsrTobeNotified = nlapiLookupField('customer', division, 'custentity_copy_appt_insp_req');
                nlapiLogExecution('DEBUG', 'bsrTobeNotified', bsrTobeNotified);
                var arr = [];
                arr = bsrTobeNotified.split(',');
                nlapiLogExecution('DEBUG', 'arr', arr.length);
                for (var z = 0; z < arr.length; z++) {
                    var b_mail = nlapiLookupField('partner', arr[z], 'email');
                    bsr_email[arr[z]] = b_mail;
                }
            }
        } catch (eb) {
            bsr_email = {};
            nlapiLogExecution('DEBUG', 'eb', eb);
        }
        nlapiLogExecution('DEBUG', 'bsr_email', JSON.stringify(bsr_email));
        var optOutBuilderLeads = 'F';
        var bsrEmail = '';
        var bsrOptOutRTAN = '';
        var bsrName = '';
        var cc = [];
        var ccRTAN = [];
        var records = new Object();
        records['activity'] = CaseIds[0];
        var copyOnRENDivision = '';
        var notificationMethod = '';
        var enableEmailNotification = '';
        var copyOnREN = null;
        var copyOnBuilderLeads = null;
        var copyOnBuilderLeadsDivision = null;
        if (defVal(dmID) != '')
            optOutBuilderLeads = nlapiLookupField('partner', dmID, 'custentity_opt_out_builder_leads');
        if (defVal(smID) != '')
            smOptOutBuilderLeads = nlapiLookupField('partner', smID, 'custentity_opt_out_builder_leads');

        if (defVal(division) != '') {
            var builderDivision = nlapiLoadRecord('customer', division);
            copyOnRENDivision = builderDivision.getFieldValues('custentity_copy_on_ren');
            notificationMethod = builderDivision.getFieldValue('custentity_appt_notification_method');
            enableEmailNotification = builderDivision.getFieldValue('custentity8');
            copyOnBuilderLeadsDivision = builderDivision.getFieldValues('custentity_copy_on_builder_leads');
        }
        if (defVal(bsrID) != '') {
            bsrName = defVal(CaseRec.getFieldValue('custevent_bsr_first_name')) + ' ';
            bsrName += defVal(CaseRec.getFieldValue('custevent_bsr_last_name'));
            var partnerInfo = nlapiLookupField('partner', bsrID, ['email', 'custentity_opt_out_rtan']);
            bsrEmail = partnerInfo.email;
            bsrOptOutRTAN = 'F'; //partnerInfo.custentity_opt_out_rtan;
        }
        // if (searchType == '1') {
            emailSubject = "New Inquiry From " + agentName;
            var propertyId = CaseRec.getFieldValue('custevent_property');
            if (defVal(propertyId) != '') {
                emailSubject = "New Inquiry From " + agentName + " For " + subdivision;
                var lot = nlapiLookupField(propertyRecType, propertyId, 'custrecord_lot_number');
                if (defVal(lot) != '')
                    emailSubject += " Lot " + lot;
            }
        // }
        nlapiLogExecution('DEBUG', '302');
        if (builderSuppliedLead == 'T')
            emailSubject = "New Web Lead Assigned To " + bsrName + " For " + agentName;

        if (defVal(topLevelBuilder) != '') {
            var topLevelBuilderRecord = nlapiLoadRecord('customer', topLevelBuilder);
            copyOnREN = topLevelBuilderRecord.getFieldValues('custentity_copy_on_ren');
            if (builderSuppliedLead == 'T')
                copyOnBuilderLeads = topLevelBuilderRecord.getFieldValues('custentity_copy_on_builder_leads');
        }

        if (copyOnREN != null) {
            for (var i = 0; copyOnREN.length > i; i++) {
                var copyUserEmail = nlapiLookupField('partner', copyOnREN[i], 'email');
                cc.push(copyUserEmail);
                CheckGovernance();
            }
        }

        if (copyOnRENDivision != null) {
            for (var i = 0; copyOnRENDivision.length > i; i++) {
                var copyUserEmail = nlapiLookupField('partner', copyOnRENDivision[i], 'email');
                cc.push(copyUserEmail);
                CheckGovernance();
            }
        }
        if (defVal(divManagerEmail) != '' && dmOptOut == 'F')
            cc.push(divManagerEmail);

        if (defVal(salesManagerEmail) != '' && smOptOut == 'F')
            cc.push(salesManagerEmail);

        if (builderSuppliedLead == 'T') {
            ccRTAN.push('ahencheck@hmsmarketingservices.com');
            if (copyOnBuilderLeads != null && copyOnBuilderLeads != '') {
                for (var i = 0; copyOnBuilderLeads.length > i; i++) {
                    var copyUserEmail = nlapiLookupField('partner', copyOnBuilderLeads[i], 'email');
                    ccRTAN.push(copyUserEmail);
                }
            }
            if (defVal(copyOnBuilderLeadsDivision) != '') {
                for (var i = 0; copyOnBuilderLeadsDivision.length > i; i++) {
                    var copyUserEmail = nlapiLookupField('partner', copyOnBuilderLeadsDivision[i], 'email');
                    ccRTAN.push(copyUserEmail);
                    CheckGovernance();
                }
            }
        } else {
            if (copyOnREN != null && copyOnREN != '') {
                for (var i = 0; copyOnREN.length > i; i++) {
                    var copyUserEmail = nlapiLookupField('partner', copyOnREN[i], 'email');
                    ccRTAN.push(copyUserEmail);
                    CheckGovernance();
                }
            }

            if (copyOnRENDivision != null && copyOnRENDivision != '') {
                for (var i = 0; copyOnRENDivision.length > i; i++) {
                    var copyUserEmail = nlapiLookupField('partner', copyOnRENDivision[i], 'email');
                    ccRTAN.push(copyUserEmail);
                    CheckGovernance();
                }
            }
            if (builderSuppliedLead == 'T') {
                if (defVal(divManagerEmail) != '' && optOutBuilderLeads == 'F')
                    ccRTAN.push(divManagerEmail);

                if (defVal(salesManagerEmail) != '' && smOptOutBuilderLeads == 'F')
                    ccRTAN.push(salesManagerEmail);
            } else {
                if (defVal(divManagerEmail) != '' && dmOptOutRTAN == 'F')
                    ccRTAN.push(divManagerEmail);
                if (defVal(salesManagerEmail) != '' && smOptOutRTAN == 'F')
                    ccRTAN.push(salesManagerEmail);
            }
        }
        //		if(defVal(adminAsstEmail) != '' && adminOptOutRTAN == 'F') commented on 11-04-18 on Jeff request
        //		ccRTAN.push(adminAsstEmail);	
        nlapiLogExecution('DEBUG', 'ccRTAN', ccRTAN);
        //		if(bsrNotifySent == 'F' && notificationMethod == '1' && enableEmailNotification == 'T' && bsrOptOutRTAN =='F' && bsrOneTimeOptOut =='F' && stage =='OPEN')
        if (notificationMethod == '1' && enableEmailNotification == 'T' && bsrOptOutRTAN == 'F' && bsrOneTimeOptOut == 'F') {

            body = emailBody
            body = body.replace('bsrid', bsrID);
            nlapiSendEmail(callCenter, bsrEmail, emailSubject, body, null, null, records, null, true);
            for (var bm in bsr_email) {
                var t_body = emailBody;
                var bsr_nsid = bm;
                bsr_mail_id = bsr_email[bm];
                t_body = t_body.replace('bsrid', bsr_nsid);

                nlapiSendEmail(callCenter, bsr_mail_id, emailSubject, t_body, null, null, records, null, true);

            }


            for (var j = 0; j < CaseIds.length; j++) {
                var fields = ['custevent_bsr_notify_sent', 'custevent_hms_last_ren_sent_date_time'];
                var values = ['T', CurrTime];
                nlapiSubmitField('supportcase', CaseIds[j], fields, values, true);
                CheckGovernance();
            }

            if (defVal(ccRTAN[0]) != '') {
                emailMerger = nlapiCreateEmailMerger(99); //smTemplate
                emailMerger.setSupportCase(CaseIds[0]);
                var mergeResult = emailMerger.merge();
                var emailbody_nl = mergeResult.getBody();
                emailbody_nl = emailbody_nl.replace('propertyrequested', data);
                emailbody_nl = emailbody_nl.replace('logoimage', imageurl);
                //		nlapiSendEmail(callCenter,'vikash.singh@webbee.biz',emailSubject,emailbody_nl);
                //             nlapiLogExecution("DEBUG","emailSubject",emailSubject)
                // nlapiLogExecution("DEBUG","emailbody_nl",emailbody_nl)
                //   nlapiLogExecution("DEBUG","ccRTAN",ccRTAN)
                //  nlapiLogExecution("DEBUG","records",JSON.stringify(records))

                //   nlapiSendEmail(callCenter, "vikash.singh@webbeeglobal.com", emailSubject, emailbody_nl, ccRTAN,null, JSON.stringify(records),null, true);    
                nlapiSendEmail(callCenter, ccRTAN[0], emailSubject, emailbody_nl, ccRTAN, null, records, null, true);
                nlapiLogExecution('DEBUG', ' Case2 : Email Sent To Primary BSR of Cases', CaseIds);
                return true;
            }
        } else if (renEnabled == 'T') {
            if (bsrOptOutRTAN == 'T' && ['5', '6', '11'].indexOf(statusID) != -1) {
                //				emailMerger = nlapiCreateEmailMerger(bsrTemplate); //68
                //				emailMerger.setSupportCase(CaseIds[0]);
                //				mergeResult = emailMerger.merge();
                //				emailHeader = mergeResult.getBody();
                body = emailBody
                var recipient = cc[0];
                if (defVal(bsrEmail) != '')
                    recipient = bsrEmail;
                body = body.replace('bsrid', bsrID);
                nlapiSendEmail(callCenter, recipient, emailSubject, body, cc, null, records, null, true);
                for (var bm in bsr_email) {
                    var t_body = emailBody;
                    var bsr_nsid = bm;
                    bsr_mail_id = bsr_email[bm];
                    t_body = t_body.replace('bsrid', bsr_nsid);
                    nlapiSendEmail(callCenter, bsr_mail_id, emailSubject, t_body, cc, null, records, null, true);
                }


                for (var j = 0; j < CaseIds.length; j++) {
                    var fields = ['custevent_ren_sent', 'custevent_hms_last_ren_sent_date_time'];
                    var values = ['T', CurrTime];
                    nlapiSubmitField('supportcase', CaseIds[j], fields, values, true);
                    CheckGovernance();
                }
                nlapiLogExecution('DEBUG', 'Case3 : Email Sent To Primary BSR of Cases', CaseIds);
            }
        }
    } catch (ex) {
        body = 'ProcessREN : ' + ex;
        body += ex.name + ' : ' + ex.message;
        nlapiSendEmail(author, bcc, subject, body);
        nlapiLogExecution('DEBUG', ' Body : ', body);
    }
}

function defVal(value) {
    try {
        if (value == null || value == undefined || value == 'undefined')
            value = '';
        return value;
    } catch (ex) {
        body = 'defVal : ' + ex;
        body += ex.name + ' : ' + ex.message;
        nlapiSendEmail(author, bcc, subject, body);
        nlapiLogExecution('DEBUG', ' Body : ', body);
        return '';
    }
}

function SetPropertyForREN(caseId) {
    try {
        var PropertyId = nlapiLookupField('supportcase', caseId, 'custevent_property');
        if (defVal(PropertyId) != '') {
            var encrypted = CryptoJS.AES.encrypt(PropertyId, SecretKey);
            var decrypted = CryptoJS.AES.decrypt(encrypted, SecretKey).toString();
            var houseNumber = nlapiLookupField(propertyRecType, PropertyId, 'custrecord_house_number');
            var enableREN = nlapiLookupField(propertyRecType, PropertyId, 'custrecord12.custentity_enable_ren');
            var street = nlapiLookupField(propertyRecType, PropertyId, 'custrecord31', true);
            var fields = ['custevent_ren_enabled', 'custevent_property_for_ren'];
            nlapiSubmitField('supportcase', caseId, fields, [enableREN, houseNumber + ' ' + street], true);
            nlapiSubmitField(propertyRecType, PropertyId, 'custrecord_secret_code', decrypted, true);
            return decrypted;
        }
        return null;
    } catch (ex) {
        body = 'SetPropertyForREN : ' + ex;
        body += ex.name + ' : ' + ex.message;
        nlapiSendEmail(author, bcc, subject, body);
        nlapiLogExecution('DEBUG', ' Body : ', body);
        return null;
    }
}

//Function CheckGovernance

function CheckGovernance() {
    try {
        var currentContext = nlapiGetContext();
        if (currentContext.getRemainingUsage() < 100) {
            body = 'Remaining Usage :', currentContext.getRemainingUsage();
            nlapiLogExecution('DEBUG', body);
            var state = nlapiYieldScript();
            if (state.status == 'FAILURE') {
                body = 'Failed to yield script, exiting:' + ', Reason = ' + state.reason + ' / Size = ' + state.size;
                nlapiLogExecution('DEBUG', body);
            } else if (state.status == 'RESUME') {
                body = 'Resuming script because of : ' + state.reason + '/ Size = ' + state.size;
                nlapiLogExecution('DEBUG', body);
            }
        }
    } catch (ex) {
        body = 'Exception : ' + ex.name;
        body += '\n Function : CheckGovernance';
        body += '\n Message : ' + ex.message;
        nlapiLogExecution('DEBUG', body);
        nlapiSendEmail(author, bcc, subject, body);
    }
}