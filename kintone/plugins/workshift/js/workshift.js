/*
*--------------------------------------------------------------------
* jQuery-Plugin "workshift"
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
		fromdate:new Date(),
		todate:new Date(),
		guidefrom:$('<div class="guidefrom">'),
		guideto:$('<div class="guideto">'),
		datecalc:null,
		legend:null,
		table:null,
		apps:{},
		config:{},
		worktimes:[],
		worktimekeys:[],
		offset:{},
		fieldinfos:{},
		colors:[],
	};
	var events={
		lists:[
			'app.record.index.show'
		]
	};
	var limit=500;
	var functions={
		/* adjust pickup dates */
		adjustdates:function(){
			switch ($('select.viewtype').val())
			{
				case '0':
					vars.todate=new Date(vars.fromdate.format('Y-m-d').dateformat());
					$('.datedisplay').css({'display':'inline-block'}).text(vars.fromdate.format('Y-m-d'));
					$('.weekdisplay').css({'display':'none'});
					$('.monthdisplay').css({'display':'none'});
					$('.calendar-button').css({'display':'inline-block'});
					break;
				case '1':
					vars.fromdate.setDate(vars.fromdate.getDate()+vars.fromdate.getDay()*-1);
					vars.todate=vars.fromdate.calc('6 day');
					$('.datedisplay').css({'display':'none'});
					$('.weekdisplay').css({'display':'inline-block'}).text(vars.fromdate.format('Y-m-d')+' ～ '+vars.todate.format('Y-m-d'));
					$('.monthdisplay').css({'display':'none'});
					$('.calendar-button').css({'display':'none'});
					break;
				case '2':
					vars.fromdate=vars.fromdate.calc('first-of-month');
					vars.todate=vars.fromdate.calc('1 month').calc('-1 day');
					$('.datedisplay').css({'display':'none'});
					$('.weekdisplay').css({'display':'none'});
					$('.monthdisplay').css({'display':'inline-block'}).text(vars.fromdate.format('Y-m-d')+' ～ '+vars.todate.format('Y-m-d'));
					$('.calendar-button').css({'display':'none'});
					break;
			}
			vars.fromdate=new Date((vars.fromdate.format('Y-m-d')+'T00:00:00+0900').dateformat());
			vars.todate=new Date((vars.todate.format('Y-m-d')+'T23:59:59+0900').dateformat());
			vars.datecalc=functions.datecalc(vars.fromdate,vars.todate);
		},
		/* rebuild view */
		build:function(filter,heads,colorindex){
			var color=vars.colors[colorindex%vars.colors.length];
			/* initialize valiable */
			if ($.inArray(heads.field,vars.worktimekeys)<0)
			{
				vars.worktimes.push({color:color,display:heads.display,time:0});
				vars.worktimekeys.push(heads.field);
			}
			/* insert row */
			vars.table.insertrow(null,function(row){
				var baserow=row;
				baserow.find('td').first().append($('<p>').addClass('customview-p').html(heads.display));
				baserow.find('td').first().append($('<input type="hidden">').val(heads.field));
				if (filter.length!=0)
				{
					for (var i=0;i<filter.length;i++)
					{
						/* create cell */
						var datecalc=functions.datecalc(
							new Date(filter[i][vars.config['fromtime']].value.dateformat()),
							new Date(filter[i][vars.config['totime']].value.dateformat()),
							new Date((vars.fromdate.format('Y-m-d')+'T00:00:00+0900').dateformat())
						);
						if (datecalc.to.hour<parseInt(vars.config['starthour'])) continue;
						var from=(datecalc.from.hour*parseInt(vars.config['scale']))+Math.floor(datecalc.from.minute/(60/parseInt(vars.config['scale'])));
						var to=(datecalc.to.hour*parseInt(vars.config['scale']))+Math.ceil(datecalc.to.minute/(60/parseInt(vars.config['scale'])))-1;
						var fromindex=0;
						var toindex=0;
						if (from<0) from=0;
						if (to>((vars.datecalc.diffhours+1)*parseInt(vars.config['scale']))-1) to=((vars.datecalc.diffhours+1)*parseInt(vars.config['scale']))-1;
						from++;
						to++;
						from=(function(from){
							var res=from;
							var columns=vars.table.head.find('tr').last().find('th');
							for (var i=from;i<columns.length;i++) if (!columns.eq(i).hasClass('hide')) {res=i;break;}
							return res;
						})(from);
						to=(function(to){
							var res=to;
							var columns=vars.table.head.find('tr').last().find('th');
							for (var i=to;i>0;i--) if (!columns.eq(i).hasClass('hide')) {res=i;break;}
							return res;
						})(to);
						if (from>to) continue;
						/* check cell merged */
						var isinsertrow=true;
						var mergerow=baserow;
						for (var i2=vars.table.contents.find('tr').index(baserow);i2<vars.table.contents.find('tr').length;i2++)
						{
							mergerow=vars.table.contents.find('tr').eq(i2);
							fromindex=vars.table.mergecellindex(mergerow,from);
							toindex=vars.table.mergecellindex(mergerow,to);
							if (!mergerow.find('td').eq(fromindex).hasClass('workshift-merge') && !mergerow.find('td').eq(toindex).hasClass('workshift-merge')) {isinsertrow=false;break;}
						}
						/* merge cell */
						if (isinsertrow)
						{
							vars.table.insertrow(null,function(row){
								fromindex=vars.table.mergecellindex(row,from);
								toindex=vars.table.mergecellindex(row,to);
								functions.mergeaftervalue(row,fromindex,toindex,filter[i],color);
								/* check row heads */
								for (var i2=0;i2<1;i2++) row.find('td').eq(i2).html(baserow.find('td').eq(i2).html());
							});
						}
						else functions.mergeaftervalue(mergerow,fromindex,toindex,filter[i],color);
						/* calculate worktime */
						vars.worktimes[vars.worktimekeys.indexOf(heads.field)].time+=datecalc.diffminutes;
					}
				}
			});
		},
		/* calculate date values */
		datecalc:function(from,to,base){
			if (!base) base=from;
			var fromdiff=from.getTime()-base.getTime();
			var todiff=to.getTime()-base.getTime();
			var basetime={
				hour:base.getHours(),
				minute:base.getMinutes()
			};
			var fromtime={
				day:fromdiff/(1000*60*60*24),
				hour:basetime.hour+Math.floor((basetime.minute+fromdiff/(1000*60))/60),
				minute:(basetime.minute+fromdiff/(1000*60))%60
			};
			var totime={
				day:todiff/(1000*60*60*24),
				hour:basetime.hour+Math.floor((basetime.minute+todiff/(1000*60))/60),
				minute:(basetime.minute+todiff/(1000*60))%60
			};
			var values={
				diffhours:Math.ceil((to.getTime()-from.getTime())/(1000*60*60)),
				diffminutes:Math.ceil((to.getTime()-from.getTime())/(1000*60)),
				from:fromtime,
				to:totime,
				formatfrom:('0'+fromtime.hour).slice(-2)+':'+('0'+fromtime.minute).slice(-2),
				formatto:('0'+totime.hour).slice(-2)+':'+('0'+totime.minute).slice(-2)
			};
			return values;
		},
		/* display calculate worktime */
		displayworktime:function(){
			vars.legend.empty();
			for (var i=0;i<vars.worktimes.length;i++)
			{
				var time=Math.floor(vars.worktimes[i].time/60).toString()+'時間'+(vars.worktimes[i].time%60).toString()+'分';
				vars.legend.append(
					$('<p>')
					.append($('<span>').addClass('color').css({'background-color':'#'+vars.worktimes[i].color}))
					.append($('<span>').text(vars.worktimes[i].display+'：'+time))
				);
			}
			$(window).trigger('resize');
		},
		/* setup merge cell value */
		mergeaftervalue:function(row,from,to,filter,color){
			var cell=row.find('td').eq(from);
			var mergeinfo={
				from:from,
				to:to,
				hide:0
			};
			for (var i=mergeinfo.from;i<mergeinfo.to+1;i++)
			{
				row.find('td').eq(i).removeClass('workshift-drag');
				if (vars.table.head.find('tr').eq(2).find('th').eq(vars.table.cellindex(row,i)).hasClass('hide'))
				{
					mergeinfo.hide++;
					to--;
				}
			}
			vars.table.mergecell(
				cell,
				from,
				to
			);
			mergeinfo.from++;
			for (var i=0;i<mergeinfo.hide;i++) row.find('td').eq(i+mergeinfo.from).addClass('hide');
			/* cell value switching */
			cell.append($('<span>').addClass('workshift-merge-span').css({'background-color':'#'+color}));
			$.each(filter,function(key,values){
				if (values!=null)
					if (values.value!=null)
						cell.append($('<input type="hidden">').attr('id',key).val(values.value));
			})
			cell.append($('<input type="hidden">').addClass('mergeto').val(mergeinfo.to));
		},
		/* reload view */
		load:function(){
			/* after apprecords acquisition,rebuild view */
			vars.apps[kintone.app.getId()]=null;
			vars.offset[kintone.app.getId()]=0;
			functions.loaddatas(kintone.app.getId(),function(){
				var records=vars.apps[kintone.app.getId()];
				var container=$('div#workshift-container').empty();
				var head=$('<tr></tr><tr></tr><tr></tr>');
				var template=$('<tr>');
				var spacer=$('<span>');
				var colspan={date:new Date(vars.fromdate.format('Y-m-d').dateformat()),hour:0,index:1,span:0};
				var week=['日','月','火','水','木','金','土'];
				var cellvalue=function(caller,row,cellindex,add){
					var head=caller.head.find('tr').eq(0);
					var columns=caller.cellindex(row,cellindex)-1+add;
					var date=head.find('th').eq(Math.floor(columns/parseInt(vars.config['scale']))+1).find('input').val();
					var hour=(Math.floor(columns/parseInt(vars.config['scale'])))%24;
					var minute=columns%parseInt(vars.config['scale'])*(60/parseInt(vars.config['scale']));
					return {
						date:date,
						hour:hour,
						minute:minute,
						datetime:new Date(date).format('Y-m-d')+'T'+hour.toString().lpad('0',2)+':'+minute.toString().lpad('0',2)+':00+0900',
						guide:new Date(date).format('m-d')+' '+hour.toString().lpad('0',2)+':'+minute.toString().lpad('0',2)
					}
				}
				/* initialize valiable */
				vars.worktimes=[];
				vars.worktimekeys=[];
				/* create table */
				head.eq(0).append($('<th class="workshift-rowcaption">').append($('<p>').addClass('customview-p').html('&nbsp;')));
				head.eq(1).append($('<th class="workshift-rowcaption">').append($('<p>').addClass('customview-p').html('&nbsp;')));
				head.eq(2).append($('<th class="workshift-rowcaption">').append($('<p>').html('&nbsp;')));
				template.append($('<td class="workshift-rowcaption">'));
				if (vars.config['scalefixed']=='1') spacer.css({'display':'block','height':'1px','width':vars.config['scalefixedwidth']+'px'});
				/* insert column */
				var init=true;
				for (var i=0;i<vars.datecalc.diffhours;i++)
				{
					var hide='';
					colspan.hour=i%24;
					if (colspan.hour<parseInt(vars.config['starthour'])) hide='class="hide"';
					if (colspan.hour>parseInt(vars.config['endhour'])) hide='class="hide"';
					if (colspan.hour==parseInt(vars.config['starthour']))
					{
						head.eq(0).find('th').eq(colspan.index).attr('colspan',colspan.span);
						for (var i2=colspan.index+1;i2<i+1;i2++) head.eq(0).find('th').eq(i2).addClass('hide');
						if (!init) colspan.date=colspan.date.calc('1 day');
						else init=false;
						colspan.index=i+1;
						colspan.span=0;
					}
					if (hide.length==0) colspan.span+=parseInt(vars.config['scale']);
					head.eq(0).append($('<th '+hide+' colspan="'+vars.config['scale']+'">')
						.append($('<span>').html(colspan.date.format('m-d')+'（'+week[colspan.date.getDay()]+'）'))
						.append($('<input type="hidden">').val(colspan.date.format('Y-m-d')))
					);
					head.eq(1).append($('<th '+hide+' colspan="'+vars.config['scale']+'">').text(colspan.hour));
					for (var i2=0;i2<parseInt(vars.config['scale']);i2++)
					{
						if (vars.config['scalefixed']=='1') head.eq(2).append($('<th '+hide+'>').append(spacer.clone(false)));
						else head.eq(2).append($('<th '+hide+'>'));
						template.append($('<td '+hide+'>'));
					}
				}
				head.eq(0).find('th').eq(colspan.index).attr('colspan',colspan.span);
				for (var i=colspan.index+1;i<head.eq(0).find('th').length;i++) head.eq(0).find('th').eq(i).hide();
				vars.table=$('<table id="workshift" class="customview-table workshift '+((vars.config['scalefixed']=='1')?'cellfixed':'')+'">').mergetable({
					container:container,
					head:head,
					template:template,
					dragclass:'workshift-drag',
					merge:true,
					mergeexclude:[0],
					mergeclass:'workshift-merge',
					mergetrigger:function(caller,cell,rowindex,cellfrom,cellto){
						var addtype='from';
						var row=caller.contents.find('tr').eq(rowindex);
						var rowcaption=row.find('td').first();
						var counter=0;
						var mergeinfos=[];
						for (var i=cellfrom;i<cellto;i++)
						{
							if (caller.head.find('tr').eq(2).find('th').eq(caller.cellindex(row,i)).hasClass('hide'))
							{
								if (addtype=='to')
								{
									mergeinfos[mergeinfos.length-1].to=cellvalue(caller,row,i-1,1);
									mergeinfos[mergeinfos.length-1].to['index']=i-1;
								}
								addtype='from';
							}
							else
							{
								if (addtype=='from')
								{
									mergeinfos.push({from:cellvalue(caller,row,i,0),to:null,record:{}});
									mergeinfos[mergeinfos.length-1].from['index']=i;
								}
								addtype='to';
							}
						}
						mergeinfos[mergeinfos.length-1].to=cellvalue(caller,row,cellto,1);
						mergeinfos[mergeinfos.length-1].to['index']=cellto;
						counter=mergeinfos.length;
						for (var i=0;i<mergeinfos.length;i++)
						{
							var mergeinfo=mergeinfos[i];
							if (mergeinfo.to.hour=='00' && mergeinfo.to.minute=='00')
							{
								mergeinfo.to.hour='23';
								mergeinfo.to.minute='59';
							}
							var fieldinfo=vars.fieldinfos[vars.config['employee']];
							switch (fieldinfo.type)
							{
								case 'USER_SELECT':
									mergeinfo.record[vars.config['employee']]={value:[{code:$('input',rowcaption).val()}]};
									break;
								default:
									mergeinfo.record[vars.config['employee']]={value:$('input',rowcaption).val()};
									break;
							}
							mergeinfo.record[vars.config['fromtime']]={value:mergeinfo.from.datetime};
							mergeinfo.record[vars.config['totime']]={value:mergeinfo.to.datetime};
							(function(mergeinfo,callback){
								var body={
									app:kintone.app.getId(),
									record:mergeinfo.record
								};
								kintone.api(kintone.api.url('/k/v1/record',true),'POST',body,function(resp){
									mergeinfo.record['$id']={value:resp.id};
									counter--;
									if (counter==0) callback();
								},function(error){
									swal('Error!',error.message,'error');
								});
							})(mergeinfo,function(){
								var color=vars.colors[rowindex%vars.colors.length];
								var mergeremain=0;
								for (var i=0;i<mergeinfos.length;i++)
								{
									var mergeinfo=mergeinfos[i];
									functions.mergeaftervalue(row,mergeinfo.from.index-mergeremain,mergeinfo.to.index-mergeremain,mergeinfo.record,color);
									mergeremain+=parseInt(row.find('td').eq(mergeinfo.from.index-mergeremain).attr('colspan'))-1;
									/* calculate worktime */
									var datecalc=functions.datecalc(
										new Date(mergeinfo.record[vars.config['fromtime']].value.dateformat()),
										new Date(mergeinfo.record[vars.config['totime']].value.dateformat())
									);
									vars.worktimes[vars.worktimekeys.indexOf($('input',rowcaption).val())].time+=datecalc.diffminutes;
								}
								/* display calculate worktime */
								functions.displayworktime();
							});
						}
					},
					unmergetrigger:function(caller,cell,rowindex,cellindex){
						swal({
							title:'確認',
							text:'削除します。\n宜しいですか?',
							type:'warning',
							showCancelButton:true,
							confirmButtonText:'OK',
							cancelButtonText:"Cancel"
						},
						function(){
							var body={
								app:kintone.app.getId(),
								id:$('#\\$id',cell).val()
							};
							kintone.api(kintone.api.url('/k/v1/record',true),'GET',body,function(resp){
								var record=resp.record;
								body={
									app:kintone.app.getId(),
									ids:[$('#\\$id',cell).val()]
								};
								kintone.api(kintone.api.url('/k/v1/records',true),'DELETE',body,function(resp){
									var row=caller.contents.find('tr').eq(rowindex);
									var rowcaption=row.find('td').first();
									var mergeto=parseInt($('.mergeto',cell).val());
									caller.unmergecell(cell.empty());
									for (var i=cellindex;i<mergeto+1;i++)
									{
										var unmergecell=row.find('td').eq(i);
										unmergecell.removeClass('workshift-drag');
										unmergecell.removeClass('workshift-merge');
										if (caller.head.find('tr').eq(2).find('th').eq(caller.cellindex(row,i)).hasClass('hide')) unmergecell.addClass('hide');
										else unmergecell.removeClass('hide')
									}
									/* calculate worktime */
									var datecalc=functions.datecalc(
										new Date(record[vars.config['fromtime']].value.dateformat()),
										new Date(record[vars.config['totime']].value.dateformat())
									);
									vars.worktimes[vars.worktimekeys.indexOf($('input',rowcaption).val())].time-=datecalc.diffminutes;
									/* display calculate worktime */
									functions.displayworktime();
								},function(error){
									swal('Error!',error.message,'error');
								});
							},function(error){
								swal('Error!',error.message,'error');
							});
						});
					},
					callback:{
						guidestart:function(e,caller,table,rowindex,cellindex){
							if (rowindex==null) {vars.guidefrom.hide();return;}
							var row=caller.contents.find('tr').eq(rowindex);
							var values=cellvalue(caller,row,cellindex,0);
							vars.guidefrom.html(values.guide).show().css({
							  'left':(row.find('td').eq(cellindex).offset().left-$(window).scrollLeft()).toString()+'px',
							  'top':(row.offset().top-$(window).scrollTop()-vars.guidefrom.outerHeight(true)).toString()+'px'
							});
						},
						guide:function(e,caller,table,rowindex,cellfrom,cellto){
							var row=caller.contents.find('tr').eq(rowindex);
							var fromvalues=cellvalue(caller,row,cellfrom,0);
							var tovalues=cellvalue(caller,row,cellto,1);
							vars.guidefrom.text(fromvalues.guide).show().css({
							  'left':(row.find('td').eq(cellfrom).offset().left-$(window).scrollLeft()).toString()+'px',
							  'top':(row.offset().top-$(window).scrollTop()-vars.guidefrom.outerHeight(true)).toString()+'px'
							});
							vars.guideto.text(tovalues.guide).show().css({
							  'left':(row.find('td').eq(cellto).offset().left-$(window).scrollLeft()+row.find('td').eq(cellto).outerWidth(true)).toString()+'px',
							  'top':(row.offset().top-$(window).scrollTop()+row.outerHeight(true)).toString()+'px'
							});
						},
						guideend:function(e){
							vars.guidefrom.hide();
							vars.guideto.hide();
						}
					}
				});
				/* place the employee data */
				var colorindex=0;
				vars.table.clearrows();
				for (var i=0;i<vars.apps['employee'].length;i++)
				{
					var employee=vars.apps['employee'][i];
					if (vars.config['assignment'].length!=0)
						if ($.inArray($('select.assignment').val(),employee.assignment)<0) continue;
					/* rebuild view */
					functions.build($.grep(records,function(item,index){
						var exists=false;
						var fieldinfo=vars.fieldinfos[vars.config['employee']];
						switch (fieldinfo.type)
						{
							case 'USER_SELECT':
								for (var i2=0;i2<item[vars.config['employee']].value.length;i2++)
									if (item[vars.config['employee']].value[i2].code==employee.field) exists=true;
								break;
							default:
								if (item[vars.config['employee']].value==employee.field) exists=true;
								break;
						}
						return exists;
					}),employee,colorindex);
					colorindex++;
				}
				/* merge row */
				var rowspan={cache:'',index:-1,span:0};
				$.each(vars.table.contents.find('tr'),function(index){
					var row=vars.table.contents.find('tr').eq(index);
					var cell=row.find('td').first();
					if (rowspan.cache!=cell.find('p').text())
					{
						if (rowspan.index!=-1)
						{
							vars.table.contents.find('tr').eq(rowspan.index).find('td').first().attr('rowspan',rowspan.span);
							for (var i=rowspan.index+1;i<index;i++) vars.table.contents.find('tr').eq(i).find('td').first().hide();
						}
						rowspan.cache=cell.find('p').text();
						rowspan.index=index;
						rowspan.span=0;
					}
					rowspan.span++;
				});
				var index=vars.table.contents.find('tr').length-1;
				var row=vars.table.contents.find('tr').last();
				var cell=row.find('td').first();
				if (rowspan.cache==cell.find('p').text() && rowspan.index!=index)
				{
					vars.table.contents.find('tr').eq(rowspan.index).find('td').first().attr('rowspan',rowspan.span);
					for (var i=rowspan.index+1;i<index+1;i++) vars.table.contents.find('tr').eq(i).find('td').first().hide();
				}
				/* display calculate worktime */
				functions.displayworktime();
			});
		},
		/* reload datas */
		loaddatas:function(appkey,callback){
			var sort='';
			var query=kintone.app.getQueryCondition();
			var body={
				app:appkey,
				query:''
			};
			query+=((query.length!=0)?' and ':'');
			query+='(';
			query+='(';
			query+=vars.config['fromtime']+'>"'+vars.fromdate.calc('-1 day').format('Y-m-d')+'T23:59:59+0900"';
			query+=' and '+vars.config['fromtime']+'<"'+vars.todate.calc('1 day').format('Y-m-d')+'T00:00:00+0900"';
			query+=')';
			query+=' or ';
			query+='(';
			query+=vars.config['totime']+'>"'+vars.fromdate.calc('-1 day').format('Y-m-d')+'T23:59:59+0900"';
			query+=' and '+vars.config['totime']+'<"'+vars.todate.calc('1 day').format('Y-m-d')+'T00:00:00+0900"';
			query+=')';
			query+=')';
			sort=' order by '+vars.config['fromtime']+' asc limit '+limit.toString()+' offset '+vars.offset[appkey].toString();
			body.query+=query+sort;
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				if (vars.apps[appkey]==null) vars.apps[appkey]=resp.records;
				else Array.prototype.push.apply(vars.apps[appkey],resp.records);
				vars.offset[appkey]+=limit;
				if (resp.records.length==limit) functions.loaddatas(appkey,callback);
				else callback();
			},function(error){});
		},
		/* reload datas of employee */
		loademployees:function(callback){
			var counter=0;
			var fieldinfo=vars.fieldinfos[vars.config['employee']];
			switch (fieldinfo.type)
			{
				case 'USER_SELECT':
					$.loadusers(function(records){
						counter=records.length;
						for (var i=0;i<records.length;i++)
						{
							var record={display:records[i].name,field:records[i].code,assignment:[]};
							if (vars.config['assignment'].length!=0)
							{
								(function(record){
									switch (vars.config['assignment'])
									{
										case '0':
											kintone.api(kintone.api.url('/v1/user/organizations',true),'GET',{code:record.field},function(resp){
												for (var i=0;i<resp.organizationTitles.length;i++) record.assignment.push(resp.organizationTitles[i].organization.code);
												counter--;
												if (counter==0) callback();
											},function(error){});
											break;
										case '1':
											kintone.api(kintone.api.url('/v1/user/groups',true),'GET',{code:record.field},function(resp){
												for (var i=0;i<resp.groups.length;i++) record.assignment.push(resp.groups[i].code);
												counter--;
												if (counter==0) callback();
											},function(error){});
											break;
									}
								})(record);
							}
							vars.apps['employee'].push(record);
						}
						/* sort employee */
						vars.apps['employee'].sort(function(a,b){
							if(a.field<b.field) return (vars.config['employeesort']=='asc')?-1:1;
							if(a.field>b.field) return (vars.config['employeesort']=='asc')?1:-1;
							return 0;
						});
						if (vars.config['assignment'].length!=0)
						{
							switch (vars.config['assignment'])
							{
								case '0':
									$.loadorganizations(function(records){
										for (var i=0;i<records.length;i++) vars.apps['assignment'][records[i].code]=records[i].name;
										if (counter==0) callback();
									});
									break;
								case '1':
									$.loadgroups(function(records){
										for (var i=0;i<records.length;i++) vars.apps['assignment'][records[i].code]=records[i].name;
										if (counter==0) callback();
									});
									break;
							}
						}
						else callback();
					});
					break;
				default:
					var body={
						app:fieldinfo.lookup.relatedApp.app,
						query:'order by '+fieldinfo.lookup.relatedKeyField+' '+vars.config['employeesort']+' limit '+limit.toString()+' offset '+vars.offset['employee'].toString()
					};
					kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
						$.each(resp.records,function(index,values){
							var record={display:values[vars.config['employeedisplay']].value,field:values[fieldinfo.lookup.relatedKeyField].value,assignment:[]};
							if (vars.config['assignment'].length!=0)
							{
								var assignment=values[vars.config['assignment']].value;
								record.assignment.push(assignment);
								if (!(assignment in vars.apps['assignment'])) vars.apps['assignment'][assignment]=assignment;
							}
							vars.apps['employee'].push(record);
						});
						vars.offset['employee']+=limit;
						if (resp.records.length==limit) functions.loademployees(callback);
						else callback();
					},function(error){});
					break;
			}
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* check viewid */
		if (event.viewId!=vars.config.workshift) return;
		/* initialize valiable */
		var container=$('div#workshift-container');
		var feed=$('<div class="workshift-headermenucontents">');
		var date=$('<span id="date" class="customview-span datedisplay">');
		var week=$('<span id="week" class="customview-span weekdisplay">');
		var month=$('<span id="month" class="customview-span monthdisplay">');
		var button=$('<button id="datepick" class="customview-button calendar-button">');
		var prev=$('<button id="prev" class="customview-button prev-button">');
		var next=$('<button id="next" class="customview-button next-button">');
		var assignment=$('<div class="kintoneplugin-select-outer">').append($('<div class="kintoneplugin-select">').append($('<select class="assignment">')));
		var viewtype=$('<div class="kintoneplugin-select-outer">').append($('<div class="kintoneplugin-select">').append($('<select class="viewtype">')));
		$('select',viewtype).append($('<option>').attr('value','0').html('&nbsp;日次&nbsp;').prop('checked',true));
		$('select',viewtype).append($('<option>').attr('value','1').html('&nbsp;週次&nbsp;'));
		$('select',viewtype).append($('<option>').attr('value','2').html('&nbsp;月次&nbsp;'));
		$('select',viewtype).on('change',function(){
			/* adjust pickup dates */
			functions.adjustdates();
			/* reload view */
			functions.load();
		});
		vars.legend=$('<div class="workshift-legend">');
		/* append elements */
		feed.append(viewtype);
		feed.append(assignment);
		feed.append(prev);
		feed.append(date);
		feed.append(week);
		feed.append(month);
		feed.append(button);
		feed.append(next);
		if ($('.workshift-headermenucontents').size()) $('.workshift-headermenucontents').remove();
		if ($('.workshift-legend').size()) $('.workshift-legend').remove();
		if ($('.guidefrom').size()) $('.guidefrom').remove();
		if ($('.guideto').size()) $('.guideto').remove();
		kintone.app.getHeaderMenuSpaceElement().appendChild(feed[0]);
		kintone.app.getHeaderSpaceElement().appendChild(vars.legend[0]);
		$('body').append(vars.guidefrom).append(vars.guideto);
		/* fixed header */
		var headeractions=$('div.contents-actionmenu-gaia');
		var headerspace=$(kintone.app.getHeaderSpaceElement());
		headeractions.parent().css({'position':'relative'});
		headerspace.parent().css({'position':'relative'});
		$(window).on('load resize scroll',function(e){
			headeractions.css({
				'left':$(window).scrollLeft().toString()+'px',
				'position':'absolute',
				'top':'0px',
				'width':$(window).width().toString()+'px'
			});
			headerspace.css({
				'left':$(window).scrollLeft().toString()+'px',
				'position':'absolute',
				'top':headeractions.outerHeight(false)+'px',
				'width':$(window).width().toString()+'px'
			});
			container.css({'margin-top':(headeractions.outerHeight(false)+headerspace.outerHeight(false))+'px','overflow-x':'visible'});
		});
		/* setup date value */
		functions.adjustdates();
		/* day pickup button */
		vars.calendar=$('body').calendar({
			selected:function(target,value){
				vars.fromdate=new Date(value.dateformat());
				/* adjust pickup dates */
				functions.adjustdates();
				/* reload view */
				functions.load();
			}
		});
		button.on('click',function(){
			vars.calendar.show({activedate:vars.fromdate});
		});
		/* day feed button */
		$.each([prev,next],function(){
			$(this).on('click',function(){
				var add=0;
				switch ($('select.viewtype').val())
				{
					case '0':
						add=($(this).attr('id')=='next')?1:-1;
						vars.fromdate=vars.fromdate.calc(add+' day');
						break;
					case '1':
						add=($(this).attr('id')=='next')?7:-7;
						vars.fromdate=vars.fromdate.calc(add+' day');
						break;
					case '2':
						add=($(this).attr('id')=='next')?1:-1;
						vars.fromdate=vars.fromdate.calc(add+' month');
						break;
				}
				/* setup date value */
				functions.adjustdates();
				/* reload view */
				functions.load();
			});
		});
		/* setup colors value */
		vars.colors=vars.config['employeecolors'].split(',');
		/* get fields of app */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.fieldinfos=resp.properties;
			/* get datas of employee */
			vars.apps['assignment']={};
			vars.apps['employee']=[];
			vars.offset['employee']=0;
			functions.loademployees(function(){
				if (vars.config['assignment'].length!=0)
				{
					/* sort assignment */
					vars.apps['assignment']=(function(base){
						var sorted={};
						var keys=Object.keys(base);
						keys.sort();
						if (vars.config['assignmentsort']=='asc') for (var i=0;i<keys.length;i++) sorted[keys[i]]=base[keys[i]];
						else for (var i=keys.length-1;i>-1;i--) sorted[keys[i]]=base[keys[i]];
						return sorted;
					})(vars.apps['assignment']);
					/* setup assignment */
					$.each(vars.apps['assignment'],function(key,values){
						$('select',assignment).append($('<option>').attr('value',key).html('&nbsp;'+values+'&nbsp;'));
					});
					$('select',assignment).on('change',function(){
						/* reload view */
						functions.load();
					});
				}
				else assignment.hide();
				/* reload view */
				functions.load();
			});
		},function(error){});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
