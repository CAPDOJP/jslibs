/*
*--------------------------------------------------------------------
* jQuery-Plugin "listsummary"
* Version: 1.0
* Copyright (c) 2017 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	var vars={
		limit:500,
		offset:0,
		summaries:[],
		config:{},
		fieldinfos:{},
	};
	var events={
		lists:[
			'app.record.index.show'
		]
	};
	var functions={
		/* load app datas */
		loaddatas:function(records,callback){
			if (vars.config.all=='1')
			{
				var sort='';
				var body={
					app:kintone.app.getId(),
					query:kintone.app.getQueryCondition()
				};
				sort=' order by $id asc limit '+vars.limit.toString()+' offset '+vars.offset.toString();
				body.query+=sort;
				kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
					Array.prototype.push.apply(records,resp.records);
					vars.offset+=vars.limit;
					if (resp.records.length==vars.limit) functions.loaddatas(records,callback);
					else callback(records);
				},function(error){
					vars.progress.hide();
					swal('Error!',error.message,'error');
				});
			}
			else callback(records);
		},
		/* calculate rounding */
		rounding:function(value){
			var digit=1;
			var res=0;
			if (vars.config.digit>0) digit=Math.pow(10,parseInt(vars.config.digit));
			switch (vars.config.round)
			{
				case '1':
					res=Math.floor(value*digit)/digit;
					break;
				case '2':
					res=Math.ceil(value*digit)/digit;
					break;
				case '3':
					res=Math.round(value*digit)/digit;
					break;
			}
			return res;
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		if (!('all' in vars.config)) return event;
		/* get views of app */
		kintone.api(kintone.api.url('/k/v1/app/views',true),'GET',{app:kintone.app.getId()},function(resp){
			$.each(resp.views,function(key,values){
				if (values.type.toUpperCase()=='LIST' && values.id==event.viewId)
				{
					/* get fields of app */
					kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
						vars.summaries=[null];
						vars.fieldinfos=resp.properties;
						/* setup summaries */
						for (var i=0;i<values.fields.length;i++)
						{
							var fieldinfo=vars.fieldinfos[values.fields[i]];
							switch (fieldinfo.type.toUpperCase())
							{
								case 'CALC':
									switch(fieldinfo.format.toUpperCase())
									{
										case 'NUMBER':
										case 'NUMBER_DIGIT':
											vars.summaries.push({
												field:fieldinfo.code,
												unit:(fieldinfo.unit)?fieldinfo.unit:'',
												unitposition:(fieldinfo.unitPosition)?fieldinfo.unitPosition.toUpperCase():'BEFORE',
												average:0,
												max:Number.MIN_SAFE_INTEGER,
												min:Number.MAX_SAFE_INTEGER,
												total:0
											});
											break;
										default:
											vars.summaries.push(null);
											break;
									}
									break;
								case 'NUMBER':
									if (!fieldinfo.lookup)
									{
										vars.summaries.push({
											field:fieldinfo.code,
											unit:(fieldinfo.unit)?fieldinfo.unit:'',
											unitposition:(fieldinfo.unitPosition)?fieldinfo.unitPosition.toUpperCase():'BEFORE',
											average:0,
											max:Number.MIN_SAFE_INTEGER,
											min:Number.MAX_SAFE_INTEGER,
											total:0
										});
									}
									else vars.summaries.push(null);
									break;
								default:
									vars.summaries.push(null);
									break;
							}
						}
						/* load app datas */
						functions.loaddatas((vars.config.all=='1')?[]:event.records,function(records){
							if (records.length!=0)
							{
								for (var i=0;i<records.length;i++)
								{
									var record=records[i];
									for (var i2=0;i2<vars.summaries.length;i2++)
									{
										var summary=vars.summaries[i2];
										if (summary)
											if (record[summary.field].value)
											{
												var value=parseFloat(record[summary.field].value.toString().replace(/[^0-9-]/g,''));
												summary.average++;
												if (summary.max<value) summary.max=value;
												if (summary.min>value) summary.min=value;
												summary.total+=value;
											}
									}
								}
								$.each($('div#view-list-data-gaia').children('table'),function(){
									var table=$(this);
									$.each(table.children('thead'),function(){
										var row=$(this);
										var cells=row.children('th');
										for (var i=0;i<cells.length;i++)
											if (i<vars.summaries.length)
												if (vars.summaries[i])
													(function(cell,summary){
														var field=$('<p>').css({
															'box-sizing':'border-box',
															'font-size':'0.85em',
															'margin':'0px 0px 0.5em 0px',
															'padding':'0px 1em',
															'width':'100%'
														});
														var fieldcaption=$('<span>').css({
															'display':'inline-block',
															'margin':'0px',
															'padding':'0px',
															'vertical-align':'top',
															'width':'3em'
														});
														var fieldvalue=$('<span>').css({
															'display':'inline-block',
															'margin':'0px',
															'overflow':'hidden',
															'padding':'0px',
															'text-align':'right',
															'text-overflow':'ellipsis',
															'vertical-align':'top',
															'white-space':'nowrap',
															'width':'calc(100% - 3em)'
														});
														var append=function(caption,value){
															if (summary.unitposition=='BEFORE')
															{
																cell.append(
																	field.clone(true)
																	.append(fieldcaption.clone(true).text(caption))
																	.append(fieldvalue.clone(true).text(summary.unit+value))
																);
															}
															else
															{
																cell.append(
																	field.clone(true)
																	.append(fieldcaption.clone(true).text(caption))
																	.append(fieldvalue.clone(true).text(value+summary.unit))
																);
															}
														}
														if (vars.config.total=='1') append('合計：',summary.total.comma());
														if (vars.config.average=='1') append('平均：',functions.rounding(((summary.average)?summary.total/summary.average:0)).comma());
														if (vars.config.max=='1') append('最大：',summary.max.comma());
														if (vars.config.min=='1') append('最小：',summary.min.comma());
													})(cells.eq(i),vars.summaries[i]);
									});
								})
							}
						});
					},function(error){swal('Error!',error.message,'error');});
				}
			})
		},function(error){swal('Error!',error.message,'error');});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
