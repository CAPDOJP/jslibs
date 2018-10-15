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
		events:[],
		config:{}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
	kintone.proxy(
		vars.config['license']+'?domain='+$(location).attr('host').replace(/\.cybozu\.com/g,''),
		'GET',
		{},
		{},
		function(body,status,headers){
			if (status>=200 && status<300)
			{
				var json=JSON.parse(body);
				if (parseInt('0'+json.permit)==0) {swal('Error!','ライセンスが登録されていません。','error');return;}
				if ('calculation' in vars.config)
				{
					vars.calculations=JSON.parse(vars.config['calculation']);
					for (var i=0;i<vars.calculations.length;i++)
					{
						vars.events.push('app.record.create.change.'+vars.calculations[i].fromdate);
						vars.events.push('app.record.edit.change.'+vars.calculations[i].fromdate);
						vars.events.push('app.record.index.edit.change.'+vars.calculations[i].fromdate);
					}
					if (vars.events)
						kintone.events.on(vars.events,function(event){
							var type=event.type.split('.');
							for (var i=0;i<vars.calculations.length;i++)
								if (type[type.length-1]==vars.calculations[i].fromdate)
								{
									var calculation=vars.calculations[i];
									if (event.changes.field.value)
									{
										var fromdate=new Date(event.changes.field.value.dateformat());
										var todate=fromdate;
										todate=todate.calc((parseInt(calculation.year)*12+parseInt(calculation.month)).toString()+' month');
										switch (calculation.day)
										{
											case '初':
												todate=todate.calc('first-of-month');
												break;
											case '末':
												todate=todate.calc('first-of-month').calc('1 month').calc('-1 day');
												break;
											default:
												todate=todate.calc(calculation.day+' day');
												break;
										}
										if (calculation.tablecode.length) event.changes.row.value[calculation.todate].value=todate.format('Y-m-d');
										else event.record[calculation.todate].value=todate.format('Y-m-d');
									}
								}
							return event;
						});
				}
			}
			else swal('Error!','ライセンス認証に失敗しました。','error');
		},
		function(error){swal('Error!','ライセンス認証に失敗しました。','error');}
	);
})(jQuery,kintone.$PLUGIN_ID);
