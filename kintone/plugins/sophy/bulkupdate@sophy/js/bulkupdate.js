/*
*--------------------------------------------------------------------
* jQuery-Plugin "bulkupdate"
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
	/*---------------------------------------------------------------
	 valiable
	---------------------------------------------------------------*/
	var vars={
		limit:500,
		offset:0,
		clearform:null,
		updateform:null,
		bulkinfos:[],
		records:[]
	};
	var events={
		lists:[
			'app.record.index.show'
		]
	};
	var functions={
		clearvalue:function(fieldinfo,record){
			switch (fieldinfo.type)
			{
				case 'CHECK_BOX':
				case 'GROUP_SELECT':
				case 'MULTI_SELECT':
				case 'ORGANIZATION_SELECT':
				case 'USER_SELECT':
					record[fieldinfo.code].value=[];
					break;
				default:
					record[fieldinfo.code].value='';
					break;
			}
		},
		fieldmapping:function(fieldinfos){
			var mappings=[];
			$.each(fieldinfos,function(key,values){
				switch (values.type)
				{
					case 'SUBTABLE':
						$.merge(mappings,functions.fieldmapping(values.fields));
						break;
					default:
						if (values.lookup)
							$.each(values.lookup.fieldMappings,function(index,values){
								mappings.push(values.field);
							});
						break;
				}
			});
			return mappings;
		},
		fieldsort:function(layout){
			var codes=[];
			$.each(layout,function(index,values){
				switch (values.type)
				{
					case 'ROW':
						$.each(values.fields,function(index,values){
							/* exclude spacer */
							if (!values.elementId) codes.push({code:values.code,cells:[]});
						});
						break;
					case 'GROUP':
						$.merge(codes,functions.fieldsort(values.layout));
						break;
					case 'SUBTABLE':
						var cells=[];
						$.each(values.fields,function(index,values){
							/* exclude spacer */
							if (!values.elementId) cells.push(values.code);
						});
						codes.push({code:values.code,cells:cells});
						break;
				}
			});
			return codes;
		},
		formatvalue:function(fieldinfo,record){
			var contents=$('#'+fieldinfo.code,vars.updateform.contents);
			var receivevalue=contents.find('.receiver').val();
			var receivevalues=[];
			switch (fieldinfo.type)
			{
				case 'CHECK_BOX':
				case 'MULTI_SELECT':
					$.each(contents.find('.receiver:checked'),function(){receivevalues.push($(this).val());});
					if (receivevalues.length!=0) record[fieldinfo.code].value=receivevalues;
					break;
				case 'GROUP_SELECT':
				case 'ORGANIZATION_SELECT':
				case 'USER_SELECT':
					if (receivevalue.length!=0)
					{
						var values=receivevalue.split(',');
						for (var i2=0;i2<values.length;i2++) receivevalues.push({code:values[i2]});
						record[fieldinfo.code].value=receivevalues;
					}
					break;
				case 'RADIO_BUTTON':
					receivevalue=contents.find('[name='+fieldinfo.code+']:checked').val();
					if (receivevalue.length!=0) record[fieldinfo.code].value=receivevalue;
					break;
				default:
					if (receivevalue.length!=0) record[fieldinfo.code].value=receivevalue;
					break;
			}
		},
		loaddatas:function(callback){
			var sort='';
			var body={
				app:kintone.app.getId(),
				query:kintone.app.getQueryCondition()
			};
			sort=' order by $id asc limit '+vars.limit.toString()+' offset '+vars.offset.toString();
			body.query+=sort;
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				Array.prototype.push.apply(vars.records,resp.records);
				vars.offset+=vars.limit;
				if (resp.records.length==vars.limit) functions.loaddatas(callback);
				else callback();
			},function(error){});
		},
		showloading:function(){
			if (!$('div#loading').size()) $('body').append($('<div id="loading">'));
			$('div#loading').show();
		},
		hideloading:function(){
			$('div#loading').hide();
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		if (vars.updateform) return;
		vars.bulkinfos=[];
		/* get layout */
		kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:kintone.app.getId()},function(resp){
			var sorted=functions.fieldsort(resp.layout);
			/* get fieldinfo */
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
				var fieldinfos=resp.properties;
				var mappings=functions.fieldmapping(resp.properties);
				$.each(sorted,function(index){
					var fieldcode=sorted[index];
					if (fieldcode.code in fieldinfos)
					{
						var fieldinfo=fieldinfos[fieldcode.code];
						if (fieldinfo.type=='SUBTABLE')
						{
							for (var i=0;i<fieldcode.cells.length;i++)
							{
								var cellinfo=$.extend(true,{},fieldinfo.fields[fieldcode.cells[i]]);
								switch (cellinfo.type)
								{
									case 'CALC':
									case 'CATEGORY':
									case 'CREATED_TIME':
									case 'CREATOR':
									case 'FILE':
									case 'MODIFIER':
									case 'RECORD_NUMBER':
									case 'REFERENCE_TABLE':
									case 'STATUS':
									case 'STATUS_ASSIGNEE':
									case 'UPDATED_TIME':
										break;
									default:
										if ($.inArray(fieldcode.cells[i],mappings)<0)
										{
											cellinfo['tablecode']=fieldcode.code;
											vars.bulkinfos.push(cellinfo);
										}
										break;
								}
							}
						}
						else
						{
							switch (fieldinfo.type)
							{
								case 'CALC':
								case 'CATEGORY':
								case 'CREATED_TIME':
								case 'CREATOR':
								case 'FILE':
								case 'MODIFIER':
								case 'RECORD_NUMBER':
								case 'REFERENCE_TABLE':
								case 'STATUS':
								case 'STATUS_ASSIGNEE':
								case 'UPDATED_TIME':
									break;
								default:
									if ($.inArray(fieldinfo.code,mappings)<0)
									{
										fieldinfo['tablecode']='';
										vars.bulkinfos.push($.extend(true,{},fieldinfo));
									}
									break;
							}
						}
					}
				});
				if (!$('.updatebutton',$('body')).size())
				{
					var button=$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/pencil.svg" class="updatebutton" alt="フィールド一括更新" title="フィールド一括更新" />').css({
						'cursor':'pointer',
						'display':'inline-block',
						'height':'48px',
						'margin':'0px 12px',
						'vertical-align':'top',
						'width':'48px'
					})
					.on('click',function(e){
						var values={};
						for (var i=0;i<vars.bulkinfos.length;i++)
						{
							var fieldinfo=vars.bulkinfos[i];
							switch (fieldinfo.type)
							{
								case 'CHECK_BOX':
								case 'GROUP_SELECT':
								case 'MULTI_SELECT':
								case 'ORGANIZATION_SELECT':
								case 'USER_SELECT':
									values[fieldinfo.code]={
										type:fieldinfo.type,
										value:[]
									};
									break;
								case 'RADIO_BUTTON':
									values[fieldinfo.code]={
										type:fieldinfo.type,
										value:'更新しない'
									};
									break;
								default:
									values[fieldinfo.code]={
										type:fieldinfo.type,
										value:''
									};
									break;
							}
						}
						vars.updateform.show({
							buttons:{
								ok:function(){
									/* close the updateform */
									vars.updateform.hide();
									swal({
										title:'確認',
										text:'レコードを更新します。\n宜しいですか?',
										type:'warning',
										showCancelButton:true,
										confirmButtonText:'OK',
										cancelButtonText:"キャンセル"
									},
									function(){
										functions.showloading();
										vars.offset=0;
										vars.records=[];
										functions.loaddatas(function(){
											var error=false;
											var offset=0;
											var limit=100;
											var records=[];
											for (var i=0;i<vars.records.length;i++)
											{
												var record={};
												$.each(vars.records[i],function(key,values){
													switch (values.type)
													{
														case 'CALC':
														case 'CATEGORY':
														case 'CREATED_TIME':
														case 'CREATOR':
														case 'FILE':
														case 'MODIFIER':
														case 'RECORD_NUMBER':
														case 'STATUS':
														case 'STATUS_ASSIGNEE':
														case 'UPDATED_TIME':
															break;
														default:
															record[key]=values;
															break;
													}
												});
												for (var i2=0;i2<vars.bulkinfos.length;i2++)
												{
													var fieldinfo=vars.bulkinfos[i2];
													if (fieldinfo['tablecode'].length!=0)
													{
														var tablecode=fieldinfo['tablecode'];
														for (var i3=0;i3<record[tablecode].value.length;i3++)
														{
															var cells=record[tablecode].value[i3].value;
															functions.formatvalue(fieldinfo,cells);
														}
													}
													else functions.formatvalue(fieldinfo,record);
												}
												records.push({
													id:record['$id'].value,
													record:record
												});
											}
											for (var i=0;i<Math.ceil(vars.records.length/limit);i++)
											{
												if (error) break;
												var body={
													app:kintone.app.getId(),
													records:[]
												};
												for (var i2=offset;i2<offset+limit;i2++) if (i2<records.length) body.records.push(records[i2]);
												(function(body,done,success,fail){
													kintone.api(kintone.api.url('/k/v1/records',true),'PUT',body,function(resp){
														if (done) success();
													},function(error){
														functions.hideloading();
														swal('Error!',error.message,'error');
														fail();
													});
												})(body,(i==Math.ceil(vars.records.length/limit)-1),function(){
													functions.hideloading();
													swal({
														title:'更新完了',
														text:'更新完了',
														type:'success'
													},function(){location.reload(true);});
												},function(){error=true;});
												offset+=limit;
											}
										});
									});
								},
								cancel:function(){
									/* close the updateform */
									vars.updateform.hide();
								}
							},
							values:values
						});
					});
					kintone.app.getHeaderMenuSpaceElement().appendChild(button[0]);
				}
				if (!$('.clearbutton',$('body')).size())
				{
					var button=$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/eraser.svg" class="clearbutton" alt="フィールド一括クリア" title="フィールド一括クリア" />').css({
						'cursor':'pointer',
						'display':'inline-block',
						'height':'48px',
						'margin':'0px 12px',
						'vertical-align':'top',
						'width':'48px'
					})
					.on('click',function(e){
						var datasource=[];
						for (var i=0;i<vars.bulkinfos.length;i++)
						{
							var fieldinfo=vars.bulkinfos[i];
							datasource.push({
								text:fieldinfo.label,
								value:fieldinfo.code
							});
						}
						vars.clearform.show({
							datasource:datasource,
							buttons:{
								ok:function(selection){
									/* close the clearform */
									vars.clearform.hide();
									if (Object.keys(selection).length==0) return;
									var labels=[];
									$.each(selection,function(key,values){labels.push(values);});
									swal({
										title:'確認',
										text:'フィールド'+labels.join('・')+'の値をクリアします。\n宜しいですか?',
										type:'warning',
										showCancelButton:true,
										confirmButtonText:'OK',
										cancelButtonText:"キャンセル"
									},
									function(){
										functions.showloading();
										vars.offset=0;
										vars.records=[];
										functions.loaddatas(function(){
											var error=false;
											var offset=0;
											var limit=100;
											var records=[];
											for (var i=0;i<vars.records.length;i++)
											{
												var record={};
												$.each(vars.records[i],function(key,values){
													switch (values.type)
													{
														case 'CALC':
														case 'CATEGORY':
														case 'CREATED_TIME':
														case 'CREATOR':
														case 'FILE':
														case 'MODIFIER':
														case 'RECORD_NUMBER':
														case 'STATUS':
														case 'STATUS_ASSIGNEE':
														case 'UPDATED_TIME':
															break;
														default:
															record[key]=values;
															break;
													}
												});
												for (var i2=0;i2<vars.bulkinfos.length;i2++)
												{
													var fieldinfo=vars.bulkinfos[i2];
													if (fieldinfo['tablecode'].length!=0)
													{
														var tablecode=fieldinfo['tablecode'];
														for (var i3=0;i3<record[tablecode].value.length;i3++)
														{
															var cells=record[tablecode].value[i3].value;
															if (fieldinfo.code in selection) functions.clearvalue(fieldinfo,cells);
														}
													}
													else
													{
														if (fieldinfo.code in selection) functions.clearvalue(fieldinfo,record);
													}
												}
												records.push({
													id:record['$id'].value,
													record:record
												});
											}
											for (var i=0;i<Math.ceil(vars.records.length/limit);i++)
											{
												if (error) break;
												var body={
													app:kintone.app.getId(),
													records:[]
												};
												for (var i2=offset;i2<offset+limit;i2++) if (i2<records.length) body.records.push(records[i2]);
												(function(body,done,success,fail){
													kintone.api(kintone.api.url('/k/v1/records',true),'PUT',body,function(resp){
														if (done) success();
													},function(error){
														functions.hideloading();
														swal('Error!',error.message,'error');
														fail();
													});
												})(body,(i==Math.ceil(vars.records.length/limit)-1),function(){
													functions.hideloading();
													swal({
														title:'更新完了',
														text:'更新完了',
														type:'success'
													},function(){location.reload(true);});
												},function(){error=true;});
												offset+=limit;
											}
										});
									});
								},
								cancel:function(){
									/* close the clearform */
									vars.clearform.hide();
								}
							}
						});
					});
					kintone.app.getHeaderMenuSpaceElement().appendChild(button[0]);
				}
				vars.clearform=$('body').multiselect({
					buttons:{
						ok:{
							text:'OK'
						},
						cancel:{
							text:'キャンセル'
						}
					}
				});
				vars.updateform=$('body').fieldsform({
					buttons:{
						ok:{
							text:'OK'
						},
						cancel:{
							text:'キャンセル'
						}
					},
					fields:vars.bulkinfos,
					radionulllabel:'更新しない'
				});
			},function(error){});
		},function(error){});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
