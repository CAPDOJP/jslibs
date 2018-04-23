/*
*--------------------------------------------------------------------
* jQuery-Plugin "calctotal"
* Version: 3.0
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
		limit:500,
		offset:0,
		summary:false,
		table:null,
		config:{},
		fieldinfos:{},
		columns:[],
		records:[],
		segments:[]
	};
	var events={
		lists:[
			'app.record.index.show'
		]
	};
	var functions={
		/* reload view */
		load:function(){
			vars.offset=0;
			vars.records=[];
			functions.loaddatas(function(){
				var prices={
					total:0,
					benefit:{
						total:0,
						segments:{}
					}
				};
				var summaries={};
				for (var i=0;i<vars.segments.length;i++) prices.benefit.segments[vars.segments[i]]=0;
				for (var i=0;i<vars.records.length;i++)
				{
					var record=vars.records[i];
					var total=0;
					var benefit=0;
					if (record[vars.config['total']].value) total=parseInt(record[vars.config['total']].value);
					if (record[vars.config['benefit']].value) benefit=parseInt(record[vars.config['benefit']].value);
					prices.total+=total;
					prices.benefit.total+=benefit;
					prices.benefit.segments[record[vars.config['benefitsegment']].value]+=benefit;
					if (vars.summary)
					{
						var key='';
						for (var i2=0;i2<vars.columns.length;i2++) key+=$.fieldvalue(record[vars.columns[i2]])+'@';
						if (!(key in summaries))
							summaries[key]={
								total:0,
								benefit:0,
								record:record
							}
						summaries[key].total+=total;
						summaries[key].benefit+=benefit;
					}
				}
				var breakdown=[];
				$.each(prices.benefit.segments,function(key,values){
					if (values!=0) breakdown.push(key+'：'+values.comma()+'円');
				});
				var head=$('<div class="calctotal-head" style="font-size:1em;line-height:1.5em;padding:1em;text-align:center;">');
				head.append($('<span style="display:inline-block;padding-right:2em;vertical-align:top;">').html('一覧合計'));
				head.append($('<span style="display:inline-block;padding-right:2em;vertical-align:top;">').html('売上：'+prices.total.comma()+'円'));
				head.append($('<span style="display:inline-block;padding-right:2em;vertical-align:top;">').html('粗利：'+prices.benefit.total.comma()+'円'));
				head.append($('<span style="display:inline-block;padding-right:2em;vertical-align:top;">').html('粗利率：'+((prices.total!=0)?Math.ceil(prices.benefit.total/prices.total*100).comma():'0')+'%'));
				if (breakdown.length!=0) head.append($('<span style="display:inline-block;font-size:0.8em;line-height:1.875em;vertical-align:top;">').html('(粗利内訳&nbsp;'+breakdown.join('&nbsp;/&nbsp;')+'&nbsp;)'));
				if ($('.calctotal-head').size()) $('.calctotal-head').remove();
				kintone.app.getHeaderSpaceElement().appendChild(head[0]);
				if (vars.summary)
				{
					$.each(summaries,function(key,values){
						vars.table.insertrow(null,function(row){
							row.addClass('recordlist-row-gaia');
							for (var i=0;i<vars.columns.length;i++)
								functions.setvalue($('div',$('#'+vars.columns[i],row)),vars.fieldinfos[vars.columns[i]],values.record[vars.columns[i]].value);
							$('div',$('.totalcell',row)).text(values.total.comma()+'円');
							$('div',$('.benefitcell',row)).text(values.benefit.comma()+'円');
							$('div',$('.benefitratecell',row)).text(((values.total!=0)?Math.ceil(values.benefit/values.total*100).comma():'0')+'%');
						});
					});
				}
			});
		},
		/* reload datas */
		loaddatas:function(callback){
			var body={
				app:kintone.app.getId(),
				query:kintone.app.getQuery().replace(/ limit [0-9]+/g,'').replace(/ offset [0-9]+/g,'')
			};
			body.query=' limit '+vars.limit.toString()+' offset '+vars.offset.toString();
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				Array.prototype.push.apply(vars.records,resp.records);
				vars.offset+=vars.limit;
				if (resp.records.length==vars.limit) functions.loaddatas(callback);
				else callback();
			},function(error){});
		},
		/* setup value */
		setvalue:function(cell,fieldinfo,values){
			var value=null;
			var unit=(fieldinfo.unit!=null)?fieldinfo.unit:'';
			var unitPosition=(fieldinfo.unitPosition!=null)?fieldinfo.unitPosition.toUpperCase():'BEFORE';
			if (values!=null)
				switch (fieldinfo.type.toUpperCase())
				{
					case 'CALC':
						if (values.length!=0)
						{
							switch(fieldinfo.format.toUpperCase())
							{
								case 'NUMBER':
									value=values;
									break;
								case 'NUMBER_DIGIT':
									value=parseFloat(values).format();
									break;
								case 'DATETIME':
									value=new Date(values.dateformat());
									value=value.format('Y-m-d H:i');
									break;
								case 'DATE':
									value=new Date((values+'T00:00:00+09:00').dateformat());
									value=value.format('Y-m-d');
									break;
								case 'TIME':
									value=new Date(('1900-01-01T'+values+':00+09:00').dateformat());
									value=value.format('H:i');
									break;
								case 'HOUR_MINUTE':
									value=values;
									break;
								case 'DAY_HOUR_MINUTE':
									value=values;
									break;
							}
							if (unitPosition=='BEFORE') value=unit+value;
							else value=value+unit;
							cell.text(value);
						}
						break;
					case 'CATEGORY':
					case 'CHECK_BOX':
					case 'MULTI_SELECT':
						if (values.length!=0)
						{
							value=values.join('<br>');
							cell.html(value);
						}
						break;
					case 'CREATOR':
					case 'MODIFIER':
						if (values.code.length!=0) cell.html('<a href="https://'+$(location).attr('host')+'/k/#/people/user/'+values.code+'" target="_blank">'+values.name+'</a>');
						break;
					case 'CREATED_TIME':
					case 'DATETIME':
					case 'UPDATED_TIME':
						if (values.length!=0)
						{
							value=new Date(values.dateformat());
							cell.text(value.format('Y-m-d H:i'));
						}
						break;
					case 'DATE':
						if (values.length!=0)
						{
							value=new Date((values+'T00:00:00+09:00').dateformat());
							cell.text(value.format('Y-m-d'));
						}
						break;
					case 'LINK':
						if (values.length!=0)
						{
							switch(fieldinfo.protocol.toUpperCase())
							{
								case 'CALL':
									value='<a href="tel:'+values+'" target="_blank">'+values+'</a>';
									break;
								case 'MAIL':
									value='<a href="mailto:'+values+'" target="_blank">'+values+'</a>';
									break;
								case 'WEB':
									value='<a href="'+values+'" target="_blank">'+values+'</a>';
									break;
							}
							cell.html(value);
						}
						break;
					case 'MULTI_LINE_TEXT':
						if (values.length!=0) cell.html(values.replace(/\n/g,'<br>'));
						break;
					case 'NUMBER':
						if (values.length!=0)
						{
							if (fieldinfo.digit) value=parseFloat(values).format();
							else value=values;
							if (unitPosition=='BEFORE') value=unit+value;
							else value=value+unit;
							cell.text(value);
						}
						break;
					case 'GROUP_SELECT':
					case 'ORGANIZATION_SELECT':
						if (values.length!=0)
						{
							value='';
							$.each(values,function(index){
								value+='<span>'+values[index].name+'</span>';
							});
							cell.html(value);
						}
						break;
					case 'RICH_TEXT':
						if (values.length!=0) cell.html(values);
						break;
					case 'STATUS_ASSIGNEE':
					case 'USER_SELECT':
						if (values.length!=0)
						{
							value='';
							$.each(values,function(index){
								value+='<a href="https://'+$(location).attr('host')+'/k/#/people/user/'+values[index].code+'" target="_blank">'+values[index].name+'</a>';
							});
							cell.html(value);
						}
						break;
					case 'TIME':
						if (values.length!=0)
						{
							value=new Date(('1900-01-01T'+values+':00+09:00').dateformat());
							cell.text(value.format('H:i'));
						}
						break;
					default:
						if (values.length!=0) cell.text(values);
						break;
				}
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if ('summaryview' in vars.config) vars.summary=($.inArray(event.viewId.toString(),JSON.parse(vars.config.summaryview))>-1);
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
					/* get fields of app */
					kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
						vars.fieldinfos=resp.properties;
						/* setup segments */
						vars.segments=[vars.fieldinfos[vars.config['benefitsegment']].options.length];
						$.each(vars.fieldinfos[vars.config['benefitsegment']].options,function(key,values){
							vars.segments[values.index]=values.label;
						});
						/* check viewid */
						if (vars.summary)
						{
							/* get views of app */
							kintone.api(kintone.api.url('/k/v1/app/views',true),'GET',{app:kintone.app.getId()},function(resp){
								$.each(resp.views,function(key,values){
									if (values.type.toUpperCase()=='LIST' && values.id==event.viewId)
									{
										/* get fields of app */
										kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
											vars.fieldinfos=resp.properties;
											/* append columns */
											var head=$('<tr>');
											var template=$('<tr>');
											vars.columns=[];
											for (var i=0;i<values.fields.length;i++)
											{
												var fieldinfo=vars.fieldinfos[values.fields[i]];
												if (fieldinfo.type!='SUBTABLE')
												{
													vars.columns.push(fieldinfo.code);
													head.append($('<th class="recordlist-header-cell-gaia">').append($('<div>').append($('<div class="recordlist-header-cell-inner-gaia">').text(fieldinfo.label))));
													template.append($('<td id="'+fieldinfo.code+'" class="recordlist-cell-gaia">').append($('<div>')));
												}
											}
											head.append($('<th class="recordlist-header-cell-gaia">').append($('<div>').append($('<div class="recordlist-header-cell-inner-gaia">').text('合計'))));
											head.append($('<th class="recordlist-header-cell-gaia">').append($('<div>').append($('<div class="recordlist-header-cell-inner-gaia">').text('粗利'))));
											head.append($('<th class="recordlist-header-cell-gaia">').append($('<div>').append($('<div class="recordlist-header-cell-inner-gaia">').text('粗利率'))));
											template.append($('<td class="recordlist-cell-gaia totalcell" style="text-align:right;">').append($('<div>')));
											template.append($('<td class="recordlist-cell-gaia benefitcell" style="text-align:right;">').append($('<div>')));
											template.append($('<td class="recordlist-cell-gaia benefitratecell" style="text-align:right;">').append($('<div>')));
											/* create table */
											vars.table=$('<table class="recordlist-gaia">').mergetable({
												container:$('div#view-list-data-gaia').empty(),
												head:head,
												template:template,
												merge:false
											});
											functions.load();
										},function(error){});
									}
								})
							});
						}
						else functions.load();
					},function(error){});
				}
				else swal('Error!','ライセンス認証に失敗しました。','error');
			},
			function(error){swal('Error!','ライセンス認証に失敗しました。','error');}
		);
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
