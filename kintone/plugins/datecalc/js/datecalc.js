/*
*--------------------------------------------------------------------
* jQuery-Plugin "datecalc"
* Version: 1.0
* Copyright (c) 2016 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	/*---------------------------------------------------------------
	 valiable
	---------------------------------------------------------------*/
	var vars={
		calculations:[],
		config:{}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
	if ('calculation' in vars.config)
	{
		vars.calculations=JSON.parse(vars.config['calculation']);
		for (var i=0;i<vars.calculations.length;i++)
		{
			var calculation=vars.calculations[i];
			var events=[];
			events.push('app.record.create.change.'+calculation.fromdate);
			events.push('mobile.app.record.create.change.'+calculation.fromdate);
			events.push('app.record.edit.change.'+calculation.fromdate);
			events.push('mobile.app.record.edit.change.'+calculation.fromdate);
			events.push('app.record.index.edit.change.'+calculation.fromdate);
			if (calculation.yearfield.length!=0)
			{
				events.push('app.record.create.change.'+calculation.yearfield);
				events.push('mobile.app.record.create.change.'+calculation.yearfield);
				events.push('app.record.edit.change.'+calculation.yearfield);
				events.push('mobile.app.record.edit.change.'+calculation.yearfield);
				events.push('app.record.index.edit.change.'+calculation.yearfield);
			}
			if (calculation.monthfield.length!=0)
			{
				events.push('app.record.create.change.'+calculation.monthfield);
				events.push('mobile.app.record.create.change.'+calculation.monthfield);
				events.push('app.record.edit.change.'+calculation.monthfield);
				events.push('mobile.app.record.edit.change.'+calculation.monthfield);
				events.push('app.record.index.edit.change.'+calculation.monthfield);
			}
			if (calculation.dayfield.length!=0)
			{
				events.push('app.record.create.change.'+calculation.dayfield);
				events.push('mobile.app.record.create.change.'+calculation.dayfield);
				events.push('app.record.edit.change.'+calculation.dayfield);
				events.push('mobile.app.record.edit.change.'+calculation.dayfield);
				events.push('app.record.index.edit.change.'+calculation.dayfield);
			}
			(function(events,calculation){
				kintone.events.on(events,function(event){
					var record=(calculation.tablecode.length!=0)?event.changes.row.value:event.record;
					if (record[calculation.fromdate].value)
					{
						var fromdate=new Date(record[calculation.fromdate].value.dateformat());
						var todate=fromdate;
						var year=(calculation.yearfield.length!=0)?record[calculation.yearfield].value:calculation.year;
						var month=(calculation.monthfield.length!=0)?record[calculation.monthfield].value:calculation.month;
						var day=(calculation.dayfield.length!=0)?record[calculation.dayfield].value:calculation.day;
						if (!year) year='0';
						if (!month) month='0';
						if (year.length==0) year='0';
						if (month.length==0) month='0';
						todate=todate.calc((parseInt(year)*12+parseInt(month)).toString()+' month');
						switch (day)
						{
							case '初':
								todate=todate.calc('first-of-month');
								break;
							case '末':
								todate=todate.calc('first-of-month').calc('1 month').calc('-1 day');
								break;
							default:
								todate=todate.calc(day+' day');
								break;
						}
						record[calculation.todate].value=todate.format('Y-m-d');
					}
					return event;
				});
			})(events,calculation);
		}
	}
})(jQuery,kintone.$PLUGIN_ID);
