/*
*--------------------------------------------------------------------
* jQuery-Plugin "facilitatorcomment"
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
		fromdate:new Date(),
		todate:new Date(),
		container:null,
		inputform:null,
		table:null,
		header:null,
		rows:null,
		template:null,
		studentselect:null,
		apps:{},
		config:{},
		offset:{},
		fieldinfos:{},
		drag:{
			capture:false,
			cells:[],
			keep:{
				column:0,
				container:0,
				position:0
			}
		},
		fields:{
			history:{
				studentname:'生徒',
				date:'受講日',
				appname:'講座',
				coursename:'コース',
				lookback:'振り返り',
				subjectname:'科目名',
				unit:'単元',
				selftarget:'目標',
				selfevaluation:'成果'
			},
			my:{
				staffname:'ファシリテーター',
				staffcomment:'コメント',
				pending:'公開判定'
			}
		},
		containers:[]
	};
	var events={
		show:[
			'app.record.index.show'
		]
	};
	var limit=500;
	var functions={
		/* reload view */
		load:function(){
			var query='';
			/* after apprecords acquisition,rebuild view */
			query='';
			query+='weekfrom="'+vars.fromdate.format('Y-m-d')+'"';
			vars.apps[kintone.app.getId()]=null;
			vars.offset[kintone.app.getId()]=0;
			functions.loaddatas(kintone.app.getId(),query,function(){
				query='';
				query+='date>"'+vars.fromdate.calc('-1 day').format('Y-m-d')+'"';
				query+=' and date<"'+vars.todate.calc('1 day').format('Y-m-d')+'"';
				query+=' and absence=0';
				if ($('.searchstudent').val()) query+=' and studentcode="'+$('.searchstudent').val()+'"';
				query+=' order by studentcode asc,date asc,starttime asc';
				vars.apps[vars.config['history']]=null;
				vars.offset[vars.config['history']]=0;
				functions.loaddatas(vars.config['history'],query,function(){
					vars.rows.empty();
					for (var i=0;i<vars.apps[vars.config['history']].length;i++)
					{
						var history=vars.apps[vars.config['history']][i];
						var comment=$.grep(vars.apps[kintone.app.getId()],function(item,index){
							return item['studentcode'].value==history['studentcode'].value;
						});
						if ($('input#inputdeny').prop('checked'))
						{
							if (comment.length!=0)
								if (comment[0][vars.config.facilitatorcomment].value)
									if (comment[0][vars.config.facilitatorcomment].value.length!=0) continue;
						}
						for (var i2=0;i2<history['reporttable'].value.length;i2++)
						{
							var row=vars.template.clone(true);
							var report=history['reporttable'].value[i2].value;
							$.each(vars.fields.history,function(key,values){
								if (key in history) $('.'+key,row).html(history[key].value.replace(/\n/g,'<br>'));
								if (key in report) $('.'+key,row).html(report[key].value.replace(/\n/g,'<br>'));
							});
							if (comment.length!=0)
							{
								$.each(vars.fields.my,function(key,values){
									if (key in comment[0])
									{
										if (!comment[0][key].value) comment[0][key].value='';
										$('.'+key,row).html(comment[0][key].value.replace(/\n/g,'<br>'));
									}
								});
								$('#id',row).val(comment[0]['$id'].value);
								$('#'+vars.config.facilitator,row).val(comment[0][vars.config.facilitator].value);
								$('#'+vars.config.facilitatorcomment,row).val(comment[0][vars.config.facilitatorcomment].value);
								$('#'+vars.config.pending,row).val((comment[0][vars.config.pending].value)?comment[0][vars.config.pending].value:'非公開');
							}
							$('#studentcode',row).val(history['studentcode'].value);
							$('#studentname',row).val(history['studentname'].value);
							vars.rows.append(row);
						}
					}
					/* merge row */
					var captioncolumns=Object.keys(vars.fields.my).length+1;
					var mergecolumns=6;
					var rowspans=[];
					for (var i=0;i<mergecolumns;i++) rowspans.push({cache:'',index:-1,span:0});
					$.each(vars.rows.find('tr'),function(index){
						var row=vars.rows.find('tr').eq(index);
						for (var i=0;i<mergecolumns;i++)
						{
							var cell=row.find('td').eq(i+captioncolumns);
							if (rowspans[i].cache!=cell.text())
							{
								if (rowspans[i].index!=-1)
								{
									vars.rows.find('tr').eq(rowspans[i].index).find('td').eq(i+captioncolumns).attr('rowspan',rowspans[i].span);
									for (var i2=rowspans[i].index+1;i2<index;i2++) vars.rows.find('tr').eq(i2).find('td').eq(i+captioncolumns).hide();
									if (i==0)
									{
										for (var i2=0;i2<captioncolumns;i2++)
										{
											vars.rows.find('tr').eq(rowspans[i].index).find('td').eq(i2).attr('rowspan',rowspans[i].span);
											for (var i3=rowspans[i].index+1;i3<index;i3++) vars.rows.find('tr').eq(i3).find('td').eq(i2).hide();
										}
									}
								}
								rowspans[i].cache=cell.text();
								rowspans[i].index=index;
								rowspans[i].span=0;
								for (var i2=i+1;i2<mergecolumns;i2++)
								{
									cell=row.find('td').eq(i2+captioncolumns);
									if (rowspans[i2].index!=-1)
									{
										vars.rows.find('tr').eq(rowspans[i2].index).find('td').eq(i2+captioncolumns).attr('rowspan',rowspans[i2].span);
										for (var i3=rowspans[i2].index+1;i3<index;i3++) vars.rows.find('tr').eq(i3).find('td').eq(i2+captioncolumns).hide();
									}
									rowspans[i2].cache=cell.text();
									rowspans[i2].index=index;
									rowspans[i2].span=0;
								}
							}
							rowspans[i].span++;
						}
					});
					var index=vars.rows.find('tr').length-1;
					var row=vars.rows.find('tr').last();
					for (var i=0;i<mergecolumns;i++)
					{
						var cell=row.find('td').eq(i+captioncolumns);
						if (rowspans[i].cache==cell.text() && rowspans[i].index!=index)
						{
							vars.rows.find('tr').eq(rowspans[i].index).find('td').eq(i+captioncolumns).attr('rowspan',rowspans[i].span);
							for (var i2=rowspans[i].index+1;i2<index+1;i2++) vars.rows.find('tr').eq(i2).find('td').eq(i+captioncolumns).hide();
							if (i==0)
							{
								for (var i2=0;i2<captioncolumns;i2++)
								{
									vars.rows.find('tr').eq(rowspans[i].index).find('td').eq(i2).attr('rowspan',rowspans[i].span);
									for (var i3=rowspans[i].index+1;i3<index+1;i3++) vars.rows.find('tr').eq(i3).find('td').eq(i2).hide();
								}
							}
						}
					}
					/* append fix containers */
					$.each(vars.table.parents(),function(index){
						var check=$(this).attr('style');
						if (check)
							if (check.indexOf(vars.table.width().toString()+'px')>-1) vars.containers.push($(this));
					});
					if (vars.containers.length==0) vars.containers.push(vars.container);
					/* mouse events */
					$(vars.table).on('mousemove','td,th',function(e){
						if (vars.drag.capture) return;
						var left=e.pageX-$(this).offset().left;
						var hit=true;
						if (left<$(this).outerWidth(false)-5) hit=false;
						if (left>$(this).outerWidth(false)) hit=false;
						if (hit) $(this).addClass('adjust');
						else $(this).removeClass('adjust');
					});
					$(vars.table).on('mousedown','td,th',function(e){
						if (!$(this).hasClass('adjust')) return;
						vars.drag.capture=true;
						vars.drag.keep.column=$(this).outerWidth(false);
						vars.drag.keep.container=vars.containers[0].outerWidth(false);
						vars.drag.keep.position=e.pageX;
						/* setup resize column */
						vars.drag.cells=[];
						$.each($('td,th',vars.table),function(index){
							if (e.pageX>$(this).offset().left && e.pageX<$(this).offset().left+$(this).outerWidth(false)) vars.drag.cells.push($(this));
						});
						e.stopPropagation();
						e.preventDefault();
					});
					$(window).on('mousemove',function(e){
						if (!vars.drag.capture) return;
						var width=0;
						width=vars.drag.keep.column+e.pageX-vars.drag.keep.position;
						if (width<15) width=15;
						/* resize column */
						$.each(vars.drag.cells,function(index){
							vars.drag.cells[index].css({'width':width.toString()+'px'});
						});
						/* resize container */
						$.each(vars.containers,function(index){
							vars.containers[index].css({'width':(vars.drag.keep.container-vars.drag.keep.column+width).toString()+'px'});
						});
						e.stopPropagation();
						e.preventDefault();
					});
					$(window).on('mouseup',function(e){
						if (!vars.drag.capture) return;
						vars.drag.capture=false;
						e.stopPropagation();
						e.preventDefault();
					});
				},function(error){});
			},function(error){});
		},
		/* reload datas */
		loaddatas:function(appkey,query,callback){
			var body={
				app:appkey,
				query:query+' limit '+limit.toString()+' offset '+vars.offset[appkey].toString()
			};
			;
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				if (vars.apps[appkey]==null) vars.apps[appkey]=resp.records;
				else Array.prototype.push.apply(vars.apps[appkey],resp.records);
				vars.offset[appkey]+=limit;
				if (resp.records.length==limit) functions.loaddatas(appkey,query,callback);
				else callback();
			},function(error){
				swal('Error!',error.message,'error');
			});
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* check viewid */
		if (event.viewId!=vars.config.facilitatorslist) return;
		/* initialize valiable */
		var feed=$('<div class="facilitatorcomment-dayfeed custom-elements">');
		var week=$('<span id="week" class="customview-span">');
		var prev=$('<button id="prev" class="customview-button prev-button">');
		var next=$('<button id="next" class="customview-button next-button">');
		var search=$('<button class="kintoneplugin-button-dialog-ok searchstudentbutton">');
		/* append elements */
		feed.append(prev);
		feed.append(week);
		feed.append(next);
		feed.append(
			$('<span class="kintoneplugin-input-checkbox-item kintoneplugin-input-checkbox-item-inline">')
			.append($('<input type="checkbox" name="checkbox" value="0" id="inputdeny" checked="checked">'))
			.append($('<label for="inputdeny">').text('コメント入力済みは表示しない'))
		);
		if ($('.custom-elements').size()) $('.custom-elements').remove();
		kintone.app.getHeaderMenuSpaceElement().appendChild(feed[0]);
		kintone.app.getHeaderMenuSpaceElement().appendChild(
			search.addClass('custom-elements')
			.text('生徒選択')
			.on('click',function(e){
				vars.studentselect.show({
					buttons:{
						cancel:function(){
							/* close the reference box */
							vars.studentselect.hide();
						}
					},
					callback:function(row){
						/* close the reference box */
						vars.studentselect.hide();
						$('.searchstudent').val(row.find('#\\$id').val());
						$('.searchstudentname').text(row.find('#name').val());
						$('.searchstudentname').closest('div').show();
						/* reload view */
						functions.load();
					}
				});
			})[0]
		);
		kintone.app.getHeaderMenuSpaceElement().appendChild(
			$('<div>').addClass('facilitatorcomment-dayfeed custom-elements').css({'display':'none'})
			.append($('<span class="customview-span searchstudentname">').css({'padding':'0px 5px 0px 15px'}))
			.append(
				$('<button class="customview-button close-button clearstudentbutton">')
				.on('click',function(e){
					$('.searchstudent').val('');
					$('.searchstudentname').text('');
					$('.searchstudentname').closest('div').hide();
					/* reload view */
					functions.load();
				})
			)
			.append($('<input type="hidden" class="searchstudent">'))[0]
		);
		/* setup date value */
		vars.fromdate.setDate(vars.fromdate.getDate()+vars.fromdate.getDay()*-1);
		vars.todate=vars.fromdate.calc('6 day');
		week.text(vars.fromdate.format('Y-m-d')+' ～ '+vars.todate.format('Y-m-d'));
		/* day feed button */
		$.each([prev,next],function(){
			$(this).on('click',function(){
				var days=($(this).attr('id')=='next')?7:-7;
				vars.fromdate=vars.fromdate.calc(days+' day');
				vars.todate=vars.todate.calc(days+' day');
				week.text(vars.fromdate.format('Y-m-d')+' ～ '+vars.todate.format('Y-m-d'));
				/* reload view */
				functions.load();
			});
		});
		$('input#inputdeny').on('change',function(){functions.load();});
		if (!$('.facilitatorcomment').size())
		{
			vars.apps[vars.config['student']]=null;
			vars.offset[vars.config['student']]=0;
			functions.loaddatas(vars.config['student'],' status not in ("退塾") order by $id asc',function(){
				/* create studentselect box */
				vars.studentselect=$('body').referer({
					datasource:vars.apps[vars.config['student']],
					displaytext:['gradename','name'],
					searches:[
						{
							id:'gradecode',
							label:'学年',
							type:'select',
							param:{app:vars.config['grade']},
							value:'code',
							text:'name',
							callback:function(row){
								vars.studentselect.search();
							}
						}
					]
				});
				vars.studentselect.searchblock.find('select').closest('label').css({'width':'100%'});
				vars.studentselect.searchblock.find('button').hide();
				/* create table */
				kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
					vars.container=$('div#facilitatorcomment-container');
					vars.table=$('<table id="facilitatorcomment" class="customview-table">');
					vars.header=$('<tr>');
					vars.rows=$('<tbody>');
					vars.template=$('<tr>');
					vars.fieldinfos=resp.properties;
					/* create inputform */
					var fields=[];
					fields.push(vars.fieldinfos[vars.config.facilitator]);
					fields.push(vars.fieldinfos[vars.config.facilitatorcomment]);
					fields.push(vars.fieldinfos[vars.config.pending]);
					vars.inputform=$('body').fieldsform({fields:fields});
					/* append button column */
					vars.header.append($('<th>').text(''));
					vars.template.append($('<td class="buttoncell">')
						.append($('<button class="customview-button edit-button">').on('click',function(){
							var row=$(this).closest('tr');
							var index=row.find('td').first().find('input#id').val();
							var values={};
							values[vars.config.facilitator]={
								type:vars.fieldinfos[vars.config.facilitator].type,
								value:row.find('td').first().find('input#'+vars.config.facilitator).val()
							};
							values[vars.config.facilitatorcomment]={
								type:vars.fieldinfos[vars.config.facilitatorcomment].type,
								value:row.find('td').first().find('input#'+vars.config.facilitatorcomment).val()
							};
							values[vars.config.pending]={
								type:vars.fieldinfos[vars.config.pending].type,
								value:row.find('td').first().find('input#'+vars.config.pending).val()
							};
							vars.inputform.show({
								buttons:{
									ok:function(){
										/* close inputform */
										vars.inputform.hide();
										var record={
											studentcode:{value:row.find('td').first().find('input#studentcode').val()},
											studentname:{value:row.find('td').first().find('input#studentname').val()},
											weekfrom:{value:vars.fromdate.format('Y-m-d')},
											weekto:{value:vars.todate.format('Y-m-d')}
										};
										for (var i=0;i<fields.length;i++)
										{
											var fieldinfo=fields[i];
											var contents=$('#'+fieldinfo.code,vars.inputform.contents);
											var receivevalue='';
											if (fieldinfo.code==vars.config.pending)
											{
												receivevalue=contents.find('[name='+fieldinfo.code+']:checked').val();
												if (receivevalue.length==0)
												{
													swal('Error!',contents.find('.title').text()+'を選択して下さい','error');
													return;
												}
												else record[fieldinfo.code]={value:receivevalue};
											}
											else
											{
												receivevalue=contents.find('.receiver').val();
												if (receivevalue.length==0)
												{
													swal('Error!',contents.find('.title').text()+'を入力して下さい。','error');
													return;
												}
												else record[fieldinfo.code]={value:receivevalue};
											}
										}
										if (index.length==0)
										{
											var body={
												app:kintone.app.getId(),
												record:record
											};
											kintone.api(kintone.api.url('/k/v1/record',true),'POST',body,function(resp){
												/* reload view */
												functions.load();
											},function(error){
												swal('Error!',error.message,'error');
											});
										}
										else
										{
											var body={
												app:kintone.app.getId(),
												id:index,
												record:record
											};
											kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
												/* reload view */
												functions.load();
											},function(error){
												swal('Error!',error.message,'error');
											});
										}
									},
									cancel:function(){
										/* close inputform */
										vars.inputform.hide();
									}
								},
								values:values
							});
						}))
						.append($('<input type="hidden" id="id" value="">'))
						.append($('<input type="hidden" id="studentcode" value="">'))
						.append($('<input type="hidden" id="studentname" value="">'))
						.append($('<input type="hidden" id="'+vars.config.facilitator+'" value="">'))
						.append($('<input type="hidden" id="'+vars.config.facilitatorcomment+'" value="">'))
						.append($('<input type="hidden" id="'+vars.config.pending+'" value="'+vars.fieldinfos[vars.config.pending].defaultValue+'">'))
					);
					/* append columns */
					$.each(vars.fields.my,function(key,values){
						vars.header.append($('<th>').addClass(key).text(values));
						vars.template.append($('<td>').addClass(key));
					});
					$.each(vars.fields.history,function(key,values){
						vars.header.append($('<th>').addClass(key).text(values));
						vars.template.append($('<td>').addClass(key));
					});
					/* append elements */
					vars.table.append($('<thead>').append(vars.header));
					vars.table.append(vars.rows);
					vars.container.empty().append(vars.table);
					/* reload view */
					functions.load();
				},function(error){});
			},function(error){});
		}
	});
})(jQuery,kintone.$PLUGIN_ID);
