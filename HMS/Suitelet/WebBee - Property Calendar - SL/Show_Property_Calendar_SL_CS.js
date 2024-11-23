/*
Name                -   Show_Property_Calendar_SL_CS.js
Script Type       -   Suitelet
Purpose            -   Show Property Calendar
Company          -   WebBee-ESolutions-PVT-LTD.
Created By        -   PRANJAL GOYAL
Client                -   HMS Marketing Services
Date                  -   5th May 2017
Modified             - 18th May 2017
*/

var body = '';
var author = 3847;
var subject = 'HMS Open House';
var recipient = 'jmcdonald@hmsmarketingservices.com';
var cc = 'mlsinfo@hmsmarketingservices.com';

function StartProcess() {
  try {
    var process = request.getParameter('process');
    if (process == 1) OpenProperties(request, response);
    else ShowCalendar(request, response);
  } catch (ex) {
    body = 'StartProcess : ' + ex;
    body += ex.name + ' : ' + ex.message;
    nlapiSendEmail(author, recipient, subject, body);
    nlapiLogExecution('DEBUG', ' Body : ', body);
  }
}

function GetHTML(builderId, builderPersId) {
  try {
    if (builderId == null) {
      builderId = '-1';
    }

    nlapiLogExecution(
      'DEBUG',
      'builderId && personnel Id',
      builderId + '-' + builderPersId
    );
    var divList = '';
    var divList2 = '';
    var divList3 = '';
    var mlsArea;

    if (defVal(builderId) != '' && defVal(builderPersId) == '') {
      if (defVal(builderId) != '' && builderId != 0 && builderId > 0) {
        //builderId = 3675;
        nlapiLogExecution('DEBUG', '49', '49');
        var mlsArea = nlapiLookupField(
          'customer',
          builderId,
          'custentity_mls_service_regions'
        );
        nlapiLogExecution('DEBUG', 'Before Switch', 'mlsArea: ' + mlsArea);
        switch (builderId) {
          case builderId == '516':
            mlsArea = 4;
          case builderId == '5047':
            mlsArea = 3;
            nlapiLogExecution('DEBUG', 'Inside Switch', 'mlsArea: ' + mlsArea);
          default:
            mlsArea = mlsArea[0];
        }
        nlapiLogExecution('DEBUG', 'mlsArea: ' + mlsArea);
        divList2 = GetPreviousWeekProperties(builderId);
        divList3 = GetFutureProperties(builderId);
        nlapiLogExecution('DEBUG', '52', '52');
        divList2 = GetPreviousWeekProperties(builderId);
        divList3 = GetFutureProperties(builderId);
      }
    } else if (defVal(builderId) != '' && defVal(builderPersId) != '') {
      var mlsArea = nlapiLookupField(
        'customer',
        builderId,
        'custentity_mls_service_regions'
      );
      switch (builderId) {
        case builderId == '516':
          mlsArea = 4;
        case builderId == '5047':
          mlsArea = 3;
          nlapiLogExecution('DEBUG', 'Inside Switch', 'mlsArea: ' + mlsArea);
        default:
          mlsArea = mlsArea[0];
      }
      nlapiLogExecution('DEBUG', 'mlsArea: ' + mlsArea);
      divList2 = GetPreviousWeekProperties(builderId);
      divList3 = GetFutureProperties(builderId);
    }
    nlapiLogExecution('DEBUG', '62', '62');

    var filters = [];
    filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));

    if (defVal(builderPersId) == '') {
      nlapiLogExecution(
        'DEBUG',
        'first filter ',
        builderId + '-' + builderPersId
      );
      filters.push(
        new nlobjSearchFilter('custrecord12', null, 'is', builderId)
      );
    } else if (defVal(builderPersId) != '') {
      nlapiLogExecution(
        'DEBUG',
        'second filter ',
        builderId + '-' + builderPersId
      );
      filters.push(
        new nlobjSearchFilter(
          'custrecord_property_bsr_team',
          null,
          'is',
          builderPersId
        )
      );
    }

    nlapiLogExecution('DEBUG', '76', '76');
    //	filters.push(new nlobjSearchFilter('custrecord_property_status', null, 'anyof', [1,8,11]));
    filters.push(
      new nlobjSearchFilter('custrecord_property_status', null, 'is', '1')
    );

    //if(defVal(mlsArea) != '')
    //filters.push(new nlobjSearchFilter('custrecord15', null, 'is', mlsArea));

    var columns = [];
    columns.push(new nlobjSearchColumn('custrecord31'));
    columns.push(new nlobjSearchColumn('custrecord_house_number'));
    columns.push(new nlobjSearchColumn('custrecord_lot_number'));
    columns.push(
      new nlobjSearchColumn(
        'custrecord_subdivision_id',
        'custrecordcustrecordsubdname'
      )
    );
    columns.push(new nlobjSearchColumn('custrecord15'));
    columns.push(new nlobjSearchColumn('custrecord16'));

    nlapiLogExecution('DEBUG', 'filters', filters);
    var results = nlapiSearchRecord(
      'customrecord_property_record',
      null,
      filters,
      columns
    );
    if (results != null && results.length > 0) {
      var len = results.length;
      if (len > 100) len = 100;
      for (var i = 0; i < len; i++) {
        var key = results[i].getId();
        var value = defVal(results[i].getValue(columns[1]));
        value += ' ' + defVal(results[i].getText(columns[0]));
        value += ' ' + defVal(results[i].getValue(columns[2]));

        var value2 = ' ' + defVal(results[i].getValue(columns[3]));
        value2 += ' ' + defVal(results[i].getText(columns[4]));
        value2 += ' ' + defVal(results[i].getText(columns[5]));

        divList += '<div class="bg-primary n-data" key="' + key + '">' + value;
        divList += '</div>';
      }
    }

    var file = nlapiLoadFile(23117);
    var html = file.getValue();

    //var logoutUrl = "scriptlet.nl?script=220&deploy=1&compid=1309901&h=2532d8ad05b80c2fd4bc";

    html +=
      '<body>' +
      '<div class="container">' +
      '<div class="row">' +
      '<div class="col-sm-12 text-center">' +
      '<div class="wrapo">' +
      '<h1 class="bg-warning p-head">Open House Request and Submission Form</h1>' +
      "<h5>To use this form, first select the properties you'd like to set open houses for under Available Properties. Select as many as you'd like.<br><br>" +
      "Then use the slider to set the start and end times, as well as which days you'd like these open houses scheduled for.<br><br>Click the button to add the Selected Open Houses" +
      "to the Summary of Open Houses. You can then make any final adjustments to your selections, and when you're satisfied click the bottom button to Submit These Open Houses to HMS.</h5>" +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div class="row">' +
      '<div class="col-sm-3 text-center">' +
      '<ul class="nav nav-tabs">' +
      '<li class="active"><a data-toggle="tab" href="#home">Select Properties</a></li>' +
      '<li><a data-toggle="tab" href="#menu1">1) Last Week\'s Open Houses</a></li>' +
      '</ul>' +
      '<div class="tab-content">' +
      '<div id="home" class="tab-pane fade in active"> ' +
      '<h4>1) Available Properties</h4>' +
      '<div id="draggable">' +
      divList +
      '</div>' +
      '</div>' +
      '<div id="menu1" class="tab-pane fade">' +
      "<h4>Last Week's Open Houses</h4>" +
      divList2 +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div class="col-sm-3">' +
      '<input type="hidden" id="builderid" value="' +
      builderId +
      '">' +
      '<input type="hidden" id="mlsareaid" value="' +
      mlsArea +
      '">' +
      '<h4 class="text-center">2-A) Use the slider below to set the start and end times.</h4>' +
      '<input type="text" id="amount" value="12:00 PM-5:00 PM" readonly="" style="border:0; color:#f6931f; font-weight:bold;margin: 0 0 8px 0;">' +
      '<div id="slider-range"></div>' +
      '<br />' +
      '<!----------------------------------------------------------------->' +
      '<h4>2-B) Select Date(s)</h4>' +
      '<!--input type="text" id="dated" name="" /-->' +
      '<div id="datepicker"></div>' +
      '<h2></h2>' +
      '</div>' +
      '<div class="col-sm-6">' +
      '<h4 class="text-center">3-A) Selected Open Houses (Click Properties and Dates to Remove Them)</h4>' +
      '<div class="e-create-box">' +
      '<h1 class="msg text-center">Add Property And Date</h1>' +
      '<div id="prop-detail" class="col-sm-6 pull-left"></div>' +
      '<div id="prop-date" class="col-sm-3 pull-right"></div>' +
      '<div id="prop-time"></div>' +
      '</div>' +
      '<div id="register" class="reg">' +
      '<button class="btn btn-info btn-block buton" id="rg-event" style="font-size:medium;"  onclick="createEvent1()">3-B) Add Above Properties (They can be modified before final submission)</button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<br><br>' +
      '<div class="row ">' +
      '<div class="col-sm-12 mod-sect bg-warning">' +
      '<div class="col-sm-10">' +
      '<button class="btn-info   buton2" id="ev-modify" data-toggle="modal" data-target="#myModal" >Modify</button>' +
      '<button class="buton2 bg-danger" id="ev-remove">Remove</button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div class="row">' +
      '<div class="col-sm-12">' +
      '<h3>4) Summary of Open Houses Selected</h3>' +
      '</div></div>' +
      '<div class="row">' +
      '<div class="col-sm-10">' +
      '<div class="event-box">' +
      divList3 +
      '</div>' +
      '</div>' +
      //+'<div class="col-sm-2">'
      //+'<h3> </h3>'
      '<button class="buton buton-green" id="rg-event" style="font-size:large;"  onclick="registerEvent()">5) Submit These Open Houses to HMS</button>' +
      '<br />' +
      '</div>' +
      '</div>' +
      '<!-- Modal -->' +
      '<div id="myModal" class="modal fade" role="dialog">' +
      '<div class="modal-dialog">' +
      '<!-- Modal content-->' +
      '<div class="modal-content">' +
      '<div class="modal-header">' +
      '<button type="button" class="close" data-dismiss="modal">&times;</button>' +
      '<h4 class="modal-title">Modify Events Before Register</h4>' +
      '</div>' +
      '<div class="modal-body">' +
      '<div class="m-dialog">' +
      '<h5><b>Please select Date</b></h5>' +
      '<div id="datepicker2"></div>' +
      '<br>' +
      '<h5><b>Please select Time Range (Hours)</b></h5>' +
      '<input type="text" id="amount2" value="10:00 AM-2:00 PM" readonly="" style="border:0; color:#f6931f; font-weight:bold;margin: 0 0 8px 0;">' +
      '<div id="slider-range2"></div>' +
      '</div>' +
      '</div>' +
      '<div class="modal-footer">' +
      '<button type="button" class="btn btn-info buton2" onclick="modify()">SAVE</button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</body>' +
      '</html>	';
    //html = "<h1>Please Read</h1><br/><body>This functionality is broken, please send all open houses to listings@hmsmarketingservices.com until this is fixed</body>";

    return html;
  } catch (ex) {
    body = 'GetHTML : ' + ex;
    body += ex.name + ' : ' + ex.message;
    nlapiSendEmail(author, recipient, subject, body);
    nlapiLogExecution('DEBUG', ' Body : ', body);
    return '';
  }
}

function GetFutureProperties(builderId) {
  try {
    var divList = '';
    var len = 0;
    var date = nlapiDateToString(new Date());

    var filters = [];
    filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    filters.push(
      new nlobjSearchFilter('custrecord_builder', null, 'is', builderId)
    );
    filters.push(
      new nlobjSearchFilter('custrecord_open_date', null, 'after', date)
    );

    var columns = [];
    columns.push(new nlobjSearchColumn('custrecord_open_property'));
    columns.push(new nlobjSearchColumn('custrecord_open_date'));
    columns.push(new nlobjSearchColumn('custrecord_open_time'));

    var results = nlapiSearchRecord(
      'customrecord_open_house_properties',
      null,
      filters,
      columns
    );
    if (results != null && results.length > 0) {
      len = results.length;
      if (len > 10) len = 10;
      for (var i = 0; i < len; i++) {
        var key = defVal(results[i].getValue(columns[0]));
        var openDate = defVal(results[i].getValue(columns[1]));
        var openTime = defVal(results[i].getValue(columns[2]));
        var propName = nlapiLookupField(
          'customrecord_property_record',
          key,
          'custrecord31',
          true
        );
        var data2 = nlapiLookupField('customrecord_property_record', key, [
          'custrecord_house_number',
          'custrecord_lot_number',
        ]);
        var value =
          defVal(data2.custrecord_house_number) +
          ' ' +
          defVal(propName) +
          ' ' +
          defVal(data2.custrecord_lot_number);

        var evhtml = '';
        evhtml +=
          '<div class="evbox" time="' +
          openTime +
          '" date="' +
          openDate +
          '" add="' +
          key +
          '">';
        evhtml += '<p class="e-time">' + openTime + '</p>';
        evhtml += '<p class="date">' + openDate + '</p>';
        evhtml += '<p class="e-add">' + value + '</p>';
        evhtml += '</div>';
        divList += evhtml;
      }
    }
    return divList;
  } catch (ex) {
    body = 'GetFutureProperties : ' + ex;
    body += ex.name + ' : ' + ex.message;
    nlapiSendEmail(author, recipient, subject, body);
    nlapiLogExecution('DEBUG', ' Body : ', body);
    return '';
  }
}

function GetPreviousWeekProperties(builderId) {
  try {
    var divList = '';
    var len = 0;
    var mlsArea = nlapiLookupField(
      'customer',
      builderId,
      'custentity_mls_service_regions'
    );
    mlsArea = mlsArea[0];

    var date = new Date();
    var newDate = nlapiAddDays(date, '-7');
    date = nlapiDateToString(date);
    newDate = nlapiDateToString(newDate);

    var filters = [];
    filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    filters.push(
      new nlobjSearchFilter('custrecord_builder', null, 'is', builderId)
    );
    filters.push(
      new nlobjSearchFilter(
        'custrecord_open_date',
        null,
        'within',
        newDate,
        date
      )
    );

    var columns = [];
    columns.push(new nlobjSearchColumn('custrecord_open_property'));
    columns.push(new nlobjSearchColumn('custrecord_open_date'));
    columns.push(new nlobjSearchColumn('custrecord_open_time'));

    var results = nlapiSearchRecord(
      'customrecord_open_house_properties',
      null,
      filters,
      columns
    );
    if (results != null && results.length > 0) {
      len = results.length;
      if (len > 100) len = 100;
      for (var i = 0; i < len; i++) {
        var key = defVal(results[i].getValue(columns[0]));
        var openDate = defVal(results[i].getValue(columns[1]));
        var openDateS = nlapiStringToDate(openDate);
        var nextDate = nlapiAddDays(openDateS, '+7');
        nextDate = nlapiDateToString(nextDate);

        var openTime = defVal(results[i].getValue(columns[2]));
        var data = nlapiLookupField(
          'customrecord_property_record',
          key,
          [
            'custrecord_property_status',
            'custrecord_house_number',
            'custrecord31',
            'custrecord_lot_number',
          ],
          true
        );
        var data2 = nlapiLookupField('customrecord_property_record', key, [
          'custrecord_house_number',
          'custrecord_lot_number',
        ]);
        var status = data.custrecord_property_status;
        var value =
          defVal(data2.custrecord_house_number) +
          ' ' +
          defVal(data.custrecord31) +
          ' ' +
          defVal(data2.custrecord_lot_number);

        if (status == 'Available') {
          divList +=
            '<div class="bg-primary n-data2" key="' +
            key +
            '" openDate="' +
            openDate +
            '" nextDate="' +
            nextDate +
            '" openTime="' +
            openTime +
            '" data-toggle="tooltip" data-placement="right" title="Time:' +
            openTime +
            ' Date:' +
            openDate +
            '">' +
            value;
          divList += '</div>';
        }
        if (status == 'Pending') {
          divList +=
            '<div class="bg-gray"  disabled key="' +
            key +
            '" openDate="' +
            openDate +
            '" nextDate="' +
            nextDate +
            '" openTime="' +
            openTime +
            '">' +
            value;
          divList += '</div>';
        }
      }
    }
    return divList;
  } catch (ex) {
    body = 'GetPreviousWeekProperties : ' + ex;
    body += ex.name + ' : ' + ex.message;
    nlapiSendEmail(author, recipient, subject, body);
    nlapiLogExecution('DEBUG', ' Body : ', body);
    return '';
  }
}

function ShowCalendar(request, response) {
  try {
    var builderId = request.getParameter('builderId');
    var builderPersId = request.getParameter('builderPersId');
    //    	var key=request.getParameter('key');	//
    var email = '';
    var phone = '';
    // 	nlapiLogExecution('DEBUG','builderId Get',builderId);
    //	nlapiLogExecution('DEBUG','key',key);

    //    	var email = nlapiLookupField('customer',builderId,'custentity_appraisal_notifications');//email
    //    	var phone = nlapiLookupField('customer',builderId,'phone')

    //	    	if(builderId == 3675 )
    //	    	{
    email = 'test@test.com';
    phone = '123456789';
    //	    	}
    //    	var hash = CryptoJS.HmacSHA256(email,phone);//
    //
    //		var hashInBase64 = CryptoJS.enc.Base64.stringify(hash);  //
    //		hashInBase = encodeURIComponent(hashInBase64);//
    //	nlapiLogExecution('DEBUG','hashInBase',hashInBase64);

    //		if(hashInBase64 != key)//
    //    	builderId = 0;//

    var contents = GetHTML(builderId, builderPersId);
    response.write(contents);
  } catch (ex) {
    body = 'ShowCalendar : ' + ex;
    body += ex.name + ' : ' + ex.message;
    nlapiSendEmail(author, recipient, subject, body);
    nlapiLogExecution('DEBUG', ' Body : ', body);
  }
}

function OpenProperties(request, response) {
  try {
    var body = request.getBody();
    var openHouse = request.getParameter('openHouse');
    if (isJSON(openHouse)) {
      openHouse = JSON.parse(openHouse);
      var builderId = openHouse.builderId;
      var mlsAreaId = openHouse.mlsAreaId;
      var totalProperties = openHouse.property.length;
      if (totalProperties > 0) {
        for (var i = 0; i < totalProperties; i++) {
          var house = openHouse.property[i];
          if (house != null) {
            var propertyId = house.propertyName;
            var openTime = house.openTime;
            var openDate = house.openDate;
            AddOpenHouse(builderId, mlsAreaId, propertyId, openDate, openTime);
          }
        }
      }
    }
    response.write(openHouse);
  } catch (ex) {
    body = 'OpenProperties : ' + ex;
    body += ex.name + ' : ' + ex.message;
    nlapiSendEmail(author, recipient, subject, body);
    nlapiLogExecution('DEBUG', ' Body : ', body);
    response.write('Error occured..');
  }
}

function AddOpenHouse(builderId, mlsAreaId, propertyId, openDate, openTime) {
  try {
    var filters = [];
    filters.push(
      new nlobjSearchFilter('custrecord_open_property', null, 'is', propertyId)
    );
    filters.push(
      new nlobjSearchFilter('custrecord_builder', null, 'is', builderId)
    );
    filters.push(
      new nlobjSearchFilter('custrecord_mls_region', null, 'is', mlsAreaId)
    );
    filters.push(
      new nlobjSearchFilter('custrecord_open_date', null, 'on', openDate)
    );
    filters.push(
      new nlobjSearchFilter('custrecord_open_time', null, 'is', openTime)
    );

    var results = nlapiSearchRecord(
      'customrecord_open_house_properties',
      null,
      filters
    );
    if (results == null) {
      var OHPRec = nlapiCreateRecord('customrecord_open_house_properties');
      OHPRec.setFieldValue('custrecord_open_property', propertyId);
      OHPRec.setFieldValue('custrecord_builder', builderId);
      OHPRec.setFieldValue('custrecord_mls_region', mlsAreaId);
      OHPRec.setFieldValue('custrecord_open_date', openDate);
      OHPRec.setFieldValue('custrecord_open_time', openTime);
      var recId = nlapiSubmitRecord(OHPRec, true);
      var propUrl = nlapiResolveURL(
        'RECORD',
        'customrecord_open_house_properties',
        recId
      );
      propUrl =
        'https://1309901.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=422&id=' +
        recId;

      body = 'New Open House to be Entered:';
      body += '<br/><br/> URL : ' + propUrl;
      nlapiLogExecution('DEBUG', ' Body : ', body);
      var emailSubject = 'New Open House';
      nlapiSendEmail(author, recipient, emailSubject, body);

      var endHTML = '<body>Thank you!</body>';
      //var contentsEnd = GetHTML(builderId,builderPersId);
      response.write(endHTML);
    }
  } catch (ex) {
    body = 'AddOpenHouse : ' + ex;
    body += ex.name + ' : ' + ex.message;
    nlapiSendEmail(author, recipient, subject, body);
    nlapiLogExecution('DEBUG', ' Body : ', body);
  }
}

function isJSON(json) {
  try {
    JSON.parse(json);
    return true;
  } catch (ex) {
    body = 'Exception : ' + ex.name;
    body += '\n Function : isJSON';
    body += '\n Message : ' + ex.message;
    nlapiSendEmail(author, recipient, subject, body);
    return false;
  }
}

function OnFieldChange(type, name, linenum) {
  try {
    if (name == 'custpage_selprop') {
      var property = nlapiGetFieldText(name);
      nlapiSetFieldValue('custpage_property', property);
    }
  } catch (ex) {
    body = 'ShowCalendar : ' + ex;
    body += ex.name + ' : ' + ex.message;
    nlapiSendEmail(author, recipient, subject, body);
    nlapiLogExecution('DEBUG', ' Body : ', body);
  }
}

function defVal(value) {
  try {
    if (value == null || value == undefined) value = '';
    return value;
  } catch (ex) {
    body = 'defVal : ' + ex;
    body += ex.name + ' : ' + ex.message;
    nlapiSendEmail(author, recipient, subject, body);
    nlapiLogExecution('DEBUG', ' Body : ', body);
    return '';
  }
}

//------------------------------------------------------------

/*
CryptoJS v3.0.2
code.google.com/p/crypto-js
(c) 2009-2012 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
var CryptoJS =
  CryptoJS ||
  (function (h, i) {
    var e = {},
      f = (e.lib = {}),
      l = (f.Base = (function () {
        function a() {}
        return {
          extend: function (j) {
            a.prototype = this;
            var d = new a();
            j && d.mixIn(j);
            d.$super = this;
            return d;
          },
          create: function () {
            var a = this.extend();
            a.init.apply(a, arguments);
            return a;
          },
          init: function () {},
          mixIn: function (a) {
            for (var d in a) a.hasOwnProperty(d) && (this[d] = a[d]);
            a.hasOwnProperty('toString') && (this.toString = a.toString);
          },
          clone: function () {
            return this.$super.extend(this);
          },
        };
      })()),
      k = (f.WordArray = l.extend({
        init: function (a, j) {
          a = this.words = a || [];
          this.sigBytes = j != i ? j : 4 * a.length;
        },
        toString: function (a) {
          return (a || m).stringify(this);
        },
        concat: function (a) {
          var j = this.words,
            d = a.words,
            c = this.sigBytes,
            a = a.sigBytes;
          this.clamp();
          if (c % 4)
            for (var b = 0; b < a; b++)
              j[(c + b) >>> 2] |=
                ((d[b >>> 2] >>> (24 - 8 * (b % 4))) & 255) <<
                (24 - 8 * ((c + b) % 4));
          else if (65535 < d.length)
            for (b = 0; b < a; b += 4) j[(c + b) >>> 2] = d[b >>> 2];
          else j.push.apply(j, d);
          this.sigBytes += a;
          return this;
        },
        clamp: function () {
          var a = this.words,
            b = this.sigBytes;
          a[b >>> 2] &= 4294967295 << (32 - 8 * (b % 4));
          a.length = h.ceil(b / 4);
        },
        clone: function () {
          var a = l.clone.call(this);
          a.words = this.words.slice(0);
          return a;
        },
        random: function (a) {
          for (var b = [], d = 0; d < a; d += 4)
            b.push((4294967296 * h.random()) | 0);
          return k.create(b, a);
        },
      })),
      o = (e.enc = {}),
      m = (o.Hex = {
        stringify: function (a) {
          for (var b = a.words, a = a.sigBytes, d = [], c = 0; c < a; c++) {
            var e = (b[c >>> 2] >>> (24 - 8 * (c % 4))) & 255;
            d.push((e >>> 4).toString(16));
            d.push((e & 15).toString(16));
          }
          return d.join('');
        },
        parse: function (a) {
          for (var b = a.length, d = [], c = 0; c < b; c += 2)
            d[c >>> 3] |= parseInt(a.substr(c, 2), 16) << (24 - 4 * (c % 8));
          return k.create(d, b / 2);
        },
      }),
      q = (o.Latin1 = {
        stringify: function (a) {
          for (var b = a.words, a = a.sigBytes, d = [], c = 0; c < a; c++)
            d.push(
              String.fromCharCode((b[c >>> 2] >>> (24 - 8 * (c % 4))) & 255)
            );
          return d.join('');
        },
        parse: function (a) {
          for (var b = a.length, d = [], c = 0; c < b; c++)
            d[c >>> 2] |= (a.charCodeAt(c) & 255) << (24 - 8 * (c % 4));
          return k.create(d, b);
        },
      }),
      r = (o.Utf8 = {
        stringify: function (a) {
          try {
            return decodeURIComponent(escape(q.stringify(a)));
          } catch (b) {
            throw Error('Malformed UTF-8 data');
          }
        },
        parse: function (a) {
          return q.parse(unescape(encodeURIComponent(a)));
        },
      }),
      b = (f.BufferedBlockAlgorithm = l.extend({
        reset: function () {
          this._data = k.create();
          this._nDataBytes = 0;
        },
        _append: function (a) {
          'string' == typeof a && (a = r.parse(a));
          this._data.concat(a);
          this._nDataBytes += a.sigBytes;
        },
        _process: function (a) {
          var b = this._data,
            d = b.words,
            c = b.sigBytes,
            e = this.blockSize,
            g = c / (4 * e),
            g = a ? h.ceil(g) : h.max((g | 0) - this._minBufferSize, 0),
            a = g * e,
            c = h.min(4 * a, c);
          if (a) {
            for (var f = 0; f < a; f += e) this._doProcessBlock(d, f);
            f = d.splice(0, a);
            b.sigBytes -= c;
          }
          return k.create(f, c);
        },
        clone: function () {
          var a = l.clone.call(this);
          a._data = this._data.clone();
          return a;
        },
        _minBufferSize: 0,
      }));
    f.Hasher = b.extend({
      init: function () {
        this.reset();
      },
      reset: function () {
        b.reset.call(this);
        this._doReset();
      },
      update: function (a) {
        this._append(a);
        this._process();
        return this;
      },
      finalize: function (a) {
        a && this._append(a);
        this._doFinalize();
        return this._hash;
      },
      clone: function () {
        var a = b.clone.call(this);
        a._hash = this._hash.clone();
        return a;
      },
      blockSize: 16,
      _createHelper: function (a) {
        return function (b, d) {
          return a.create(d).finalize(b);
        };
      },
      _createHmacHelper: function (a) {
        return function (b, d) {
          return g.HMAC.create(a, d).finalize(b);
        };
      },
    });
    var g = (e.algo = {});
    return e;
  })(Math);
(function (h) {
  var i = CryptoJS,
    e = i.lib,
    f = e.WordArray,
    e = e.Hasher,
    l = i.algo,
    k = [],
    o = [];
  (function () {
    function e(a) {
      for (var b = h.sqrt(a), d = 2; d <= b; d++) if (!(a % d)) return !1;
      return !0;
    }
    function f(a) {
      return (4294967296 * (a - (a | 0))) | 0;
    }
    for (var b = 2, g = 0; 64 > g; )
      e(b) &&
        (8 > g && (k[g] = f(h.pow(b, 0.5))), (o[g] = f(h.pow(b, 1 / 3))), g++),
        b++;
  })();
  var m = [],
    l = (l.SHA256 = e.extend({
      _doReset: function () {
        this._hash = f.create(k.slice(0));
      },
      _doProcessBlock: function (e, f) {
        for (
          var b = this._hash.words,
            g = b[0],
            a = b[1],
            j = b[2],
            d = b[3],
            c = b[4],
            h = b[5],
            l = b[6],
            k = b[7],
            n = 0;
          64 > n;
          n++
        ) {
          if (16 > n) m[n] = e[f + n] | 0;
          else {
            var i = m[n - 15],
              p = m[n - 2];
            m[n] =
              (((i << 25) | (i >>> 7)) ^ ((i << 14) | (i >>> 18)) ^ (i >>> 3)) +
              m[n - 7] +
              (((p << 15) | (p >>> 17)) ^
                ((p << 13) | (p >>> 19)) ^
                (p >>> 10)) +
              m[n - 16];
          }
          i =
            k +
            (((c << 26) | (c >>> 6)) ^
              ((c << 21) | (c >>> 11)) ^
              ((c << 7) | (c >>> 25))) +
            ((c & h) ^ (~c & l)) +
            o[n] +
            m[n];
          p =
            (((g << 30) | (g >>> 2)) ^
              ((g << 19) | (g >>> 13)) ^
              ((g << 10) | (g >>> 22))) +
            ((g & a) ^ (g & j) ^ (a & j));
          k = l;
          l = h;
          h = c;
          c = (d + i) | 0;
          d = j;
          j = a;
          a = g;
          g = (i + p) | 0;
        }
        b[0] = (b[0] + g) | 0;
        b[1] = (b[1] + a) | 0;
        b[2] = (b[2] + j) | 0;
        b[3] = (b[3] + d) | 0;
        b[4] = (b[4] + c) | 0;
        b[5] = (b[5] + h) | 0;
        b[6] = (b[6] + l) | 0;
        b[7] = (b[7] + k) | 0;
      },
      _doFinalize: function () {
        var e = this._data,
          f = e.words,
          b = 8 * this._nDataBytes,
          g = 8 * e.sigBytes;
        f[g >>> 5] |= 128 << (24 - (g % 32));
        f[(((g + 64) >>> 9) << 4) + 15] = b;
        e.sigBytes = 4 * f.length;
        this._process();
      },
    }));
  i.SHA256 = e._createHelper(l);
  i.HmacSHA256 = e._createHmacHelper(l);
})(Math);
(function () {
  var h = CryptoJS,
    i = h.enc.Utf8;
  h.algo.HMAC = h.lib.Base.extend({
    init: function (e, f) {
      e = this._hasher = e.create();
      'string' == typeof f && (f = i.parse(f));
      var h = e.blockSize,
        k = 4 * h;
      f.sigBytes > k && (f = e.finalize(f));
      for (
        var o = (this._oKey = f.clone()),
          m = (this._iKey = f.clone()),
          q = o.words,
          r = m.words,
          b = 0;
        b < h;
        b++
      )
        (q[b] ^= 1549556828), (r[b] ^= 909522486);
      o.sigBytes = m.sigBytes = k;
      this.reset();
    },
    reset: function () {
      var e = this._hasher;
      e.reset();
      e.update(this._iKey);
    },
    update: function (e) {
      this._hasher.update(e);
      return this;
    },
    finalize: function (e) {
      var f = this._hasher,
        e = f.finalize(e);
      f.reset();
      return f.finalize(this._oKey.clone().concat(e));
    },
  });
})();

/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function () {
  var h = CryptoJS,
    j = h.lib.WordArray;
  h.enc.Base64 = {
    stringify: function (b) {
      var e = b.words,
        f = b.sigBytes,
        c = this._map;
      b.clamp();
      b = [];
      for (var a = 0; a < f; a += 3)
        for (
          var d =
              (((e[a >>> 2] >>> (24 - 8 * (a % 4))) & 255) << 16) |
              (((e[(a + 1) >>> 2] >>> (24 - 8 * ((a + 1) % 4))) & 255) << 8) |
              ((e[(a + 2) >>> 2] >>> (24 - 8 * ((a + 2) % 4))) & 255),
            g = 0;
          4 > g && a + 0.75 * g < f;
          g++
        )
          b.push(c.charAt((d >>> (6 * (3 - g))) & 63));
      if ((e = c.charAt(64))) for (; b.length % 4; ) b.push(e);
      return b.join('');
    },
    parse: function (b) {
      var e = b.length,
        f = this._map,
        c = f.charAt(64);
      c && ((c = b.indexOf(c)), -1 != c && (e = c));
      for (var c = [], a = 0, d = 0; d < e; d++)
        if (d % 4) {
          var g = f.indexOf(b.charAt(d - 1)) << (2 * (d % 4)),
            h = f.indexOf(b.charAt(d)) >>> (6 - 2 * (d % 4));
          c[a >>> 2] |= (g | h) << (24 - 8 * (a % 4));
          a++;
        }
      return j.create(c, a);
    },
    _map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
  };
})();
