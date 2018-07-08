/*
*--------------------------------------------------------------------
* jQuery-Plugin "ganttchart-monthly"
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
		fromdate:new Date().calc('first-of-month'),
		todate:new Date().calc('first-of-month').calc('1 month').calc('-1 day'),
		guidefrom:$('<div class="guidefrom">'),
		guideto:$('<div class="guideto">'),
		datecalc:null,
		fromcalendar:null,
		tocalendar:null,
		table:null,
		apps:{},
		config:{},
		levels:{},
		offset:{},
		segments:{},
		colors:[],
		displays:[],
		fields:[],
		segmentkeys:[],
		fieldinfos:{}
	};
	var events={
		lists:[
			'app.record.index.show'
		],
		show:[
			'app.record.create.show',
			'app.record.edit.show'
		]
	};
	var limit=500;
	var functions={
		/* rebuild view */
		build:function(filter,heads,colorindex){
			if (vars.config['registeredonly']=='1' && filter.length==0) return;
			var color=vars.colors[colorindex%vars.colors.length];
			/* insert row */
			vars.table.insertrow(null,function(row){
				var baserow=row;
				var index=0;
				if (vars.levels.lookup)
				{
					for (var i=0;i<vars.segmentkeys.length;i++)
					{
						baserow.find('td').eq(i).append($('<p>').addClass('customview-p').html($.fieldvalue(heads[vars.segmentkeys[i]])));
						if (i==0) baserow.find('td').eq(i).append($('<input type="hidden" id="segment">').val($.fieldvalue(heads[vars.levels.relatedkey])));
					}
				}
				else
				{
					$.each(heads,function(key,values){
						baserow.find('td').eq(index)
						.append($('<p>').addClass('customview-p').html(values.display))
						.append($('<input type="hidden" id="segment">').val(values.field));
						index++;
					});
				}
				if (filter.length!=0)
				{
					for (var i=0;i<filter.length;i++)
					{
						/* create cell */
						var datecalc=$.ganttchartdatecalc(
							new Date(filter[i][vars.config['fromdate']].value.dateformat()),
							new Date(filter[i][vars.config['todate']].value.dateformat()),
							vars.fromdate
						);
						var from=datecalc.from.day;
						var to=datecalc.to.day;
						var fromindex=0;
						var toindex=0;
						if (from<0) from=0;
						if (to>vars.datecalc.diffdays-1) to=vars.datecalc.diffdays-1;
						from+=vars.segmentkeys.length;
						to+=vars.segmentkeys.length;
						/* check cell merged */
						var isinsertrow=true;
						var mergerow=baserow;
						for (var i2=vars.table.contents.find('tr').index(baserow);i2<vars.table.contents.find('tr').length;i2++)
						{
							mergerow=vars.table.contents.find('tr').eq(i2);
							fromindex=vars.table.mergecellindex(mergerow,from);
							toindex=vars.table.mergecellindex(mergerow,to);
							if (!mergerow.find('td').eq(fromindex).hasClass('ganttchart-merge') && !mergerow.find('td').eq(toindex).hasClass('ganttchart-merge')) {isinsertrow=false;break;}
						}
						/* merge cell */
						if (isinsertrow)
						{
							vars.table.insertrow(null,function(row){
								fromindex=vars.table.mergecellindex(row,from);
								toindex=vars.table.mergecellindex(row,to);
								functions.mergeaftervalue(row,fromindex,toindex,filter[i],color);
								/* check row heads */
								for (var i2=0;i2<vars.segmentkeys.length;i2++) row.find('td').eq(i2).html(baserow.find('td').eq(i2).html());
							});
						}
						else functions.mergeaftervalue(mergerow,fromindex,toindex,filter[i],color);
					}
				}
			});
		},
		/* setup merge cell value */
		mergeaftervalue:function(row,from,to,filter,color){
			var cell=row.find('td').eq(from);
			vars.table.mergecell(
				cell,
				from,
				to
			);
			/* cell value switching */
			var displays=$('<p>').addClass('ganttchart-merge-p');
			for (var i=0;i<vars.displays.length;i++) displays.append($('<span>').html($.fieldvalue(filter[vars.displays[i]])));
			row.find('td').eq(from).append(displays);
			row.find('td').eq(from).append($('<span>').addClass('ganttchart-merge-span').css({'background-color':'#'+color}));
			if (vars.config['registeredonly']=='1') row.find('td').eq(from).on('click',function(){
				window.location.href=kintone.api.url('/k/', true).replace(/\.json/g,'')+kintone.app.getId()+'/show#record='+$(this).find('input#\\$id').val()+'&mode=show';
			});
			$.each(filter,function(key,values){
				if (values!=null)
					if (values.value!=null)
						row.find('td').eq(from).append($('<input type="hidden">').attr('id',key).val(values.value));
			});
			/* append balloon */
			var balloon=$('<div class="ganttchart-balloon">');
			var inner='';
			inner+='<p>';
			for (var i=0;i<vars.displays.length;i++) inner+='<p>'+$.fieldvalue(filter[vars.displays[i]])+'</p>';
			$('body').append(
				balloon.css({
					'z-index':(vars.apps[kintone.app.getId()].length+$('div.ganttchart-balloon').length+1).toString()
				})
				.html(inner)
			);
			/* setup cell datas */
			$.data(cell[0],'balloon',balloon);
			/* mouse events */
			cell.on({
				'mouseenter':function(){$.data($(this)[0],'balloon').addClass('ganttchart-balloon-show');},
				'mouseleave':function(){$.data($(this)[0],'balloon').removeClass('ganttchart-balloon-show');}
			});
		},
		/* reload view */
		load:function(){
			/* after apprecords acquisition,rebuild view */
			vars.apps[kintone.app.getId()]=[];
			vars.offset[kintone.app.getId()]=0;
			functions.loaddatas(kintone.app.getId(),function(){
				var records=vars.apps[kintone.app.getId()];
				var heads={
					index:0,
					prev:1,
					total:1,
					values:[]
				};
				/* clear balloon */
				$('div.ganttchart-balloon').remove();
				/* create rowheads */
				if (vars.levels.lookup) heads.values=vars.apps[vars.levels.app];
				else
				{
					$.each(vars.segments,function(key,values){heads.total*=values.records.length;});
					for (var i=0;i<heads.total;i++) heads.values.push({});
					$.each(vars.segments,function(key,values){
						heads.index=0;
						for (var i=0;i<heads.prev;i++)
							for (var i2=0;i2<values.records.length;i2++)
								for (var i3=0;i3<heads.total/heads.prev/values.records.length;i3++)
								{
									heads.values[heads.index][key]=values.records[i2];
									heads.index++;
								}
						heads.prev*=values.records.length;
					});
				}
				/* create table */
				var container=$('div#ganttchart-container').empty();
				var head=$('<tr></tr><tr></tr>');
				var template=$('<tr>');
				var spacer=$('<span class="spacer">');
				var mergeexclude=[];
				var columns={cache:vars.fromdate,index:vars.segmentkeys.length,span:0};
				for (var i=0;i<vars.segmentkeys.length;i++)
				{
					head.eq(0).append($('<th class="ganttchart-cellhead">'));
					head.eq(1).append($('<th class="ganttchart-cellhead">'));
					template.append($('<td class="ganttchart-cellhead">'));
					mergeexclude.push(i);
				}
				if (vars.config['scalefixed']=='1') spacer.css({'width':vars.config['scalefixedwidth']+'px'});
				for (var i=0;i<vars.datecalc.diffdays;i++)
				{
					if (i!=0 && columns.cache.getDate()==1)
					{
						head.eq(0).find('th').eq(columns.index).attr('colspan',columns.span);
						for (var i2=columns.index+1;i2<i+vars.segmentkeys.length;i2++) head.eq(0).find('th').eq(i2).hide();
						columns.index=i+vars.segmentkeys.length;
						columns.span=0;
					}
					head.eq(0).append($('<th>').text(columns.cache.format('Y-m')));
					head.eq(1).append($('<th>').append($('<span>').text(columns.cache.getDate())).append(spacer.clone(false)));
					if (columns.cache.format('Y-m-d')==new Date().format('Y-m-d')) template.append($('<td>').addClass("ganttchart-today"));
					else
					{
						switch (columns.cache.getDay())
						{
							case 0:
								template.append($('<td>').addClass("ganttchart-sunday"));
								break;
							case 6:
								template.append($('<td>').addClass("ganttchart-saturday"));
								break;
							default:
								template.append($('<td>'));
								break;
						}
					}
					columns.cache=columns.cache.calc('1 day');
					columns.span++;
				}
				head.eq(0).find('th').eq(columns.index).attr('colspan',columns.span);
				for (var i=columns.index+1;i<head.eq(0).find('th').length;i++) head.eq(0).find('th').eq(i).hide();
				vars.table=$('<table id="ganttchart" class="customview-table ganttchart '+((vars.config['scalefixed']=='1')?'cellfixed':'')+'">').mergetable({
					container:container,
					head:head,
					template:template,
					dragclass:'ganttchart-drag',
					merge:(vars.config['registeredonly']!='1'),
					mergeexclude:mergeexclude,
					mergeclass:'ganttchart-merge',
					mergetrigger:function(caller,cell,rowindex,cellfrom,cellto){
						var query='';
						var fromday=caller.cellindex(cell.parent(),cellfrom)-vars.segmentkeys.length;
						var today=caller.cellindex(cell.parent(),cellto)-vars.segmentkeys.length;
						query+='&'+vars.config['fromdate']+'='+vars.fromdate.calc(fromday.toString()+' day').format('Y-m-d');
						query+='&'+vars.config['todate']+'='+vars.fromdate.calc(today.toString()+' day').format('Y-m-d');
						if (vars.levels.lookup) query+='&'+vars.levels.lookup+'='+caller.contents.find('tr').eq(rowindex).find('td').first().find('input#segment').val();
						else for (var i=0;i<vars.segmentkeys.length;i++) query+='&'+vars.segmentkeys[i]+'='+caller.contents.find('tr').eq(rowindex).find('td').eq(i).find('input#segment').val();
						window.location.href=kintone.api.url('/k/', true).replace(/\.json/g,'')+kintone.app.getId()+'/edit?'+query;
					},
					unmergetrigger:function(caller,cell,rowindex,cellindex){
						window.location.href=kintone.api.url('/k/', true).replace(/\.json/g,'')+kintone.app.getId()+'/show#record='+cell.find('input#\\$id').val()+'&mode=show';
					},
					callback:{
						guidestart:function(e,caller,table,rowindex,cellindex){
							if (rowindex==null) {vars.guidefrom.hide();return;}
							var row=table.find('tbody').find('tr').eq(rowindex);
							var day=caller.cellindex(row,cellindex)-vars.segmentkeys.length;
							vars.guidefrom.text(vars.fromdate.calc(day.toString()+' day').format('m-d')).show().css({
							  'left':(row.find('td').eq(cellindex).offset().left-$(window).scrollLeft()).toString()+'px',
							  'top':(row.offset().top-$(window).scrollTop()-vars.guidefrom.outerHeight(true)).toString()+'px'
							});
						},
						guide:function(e,caller,table,rowindex,cellfrom,cellto){
							var row=table.find('tbody').find('tr').eq(rowindex);
							var fromday=caller.cellindex(row,cellfrom)-vars.segmentkeys.length;
							var today=caller.cellindex(row,cellto)-vars.segmentkeys.length;
							vars.guidefrom.text(vars.fromdate.calc(fromday.toString()+' day').format('m-d')).show().css({
							  'left':(row.find('td').eq(cellfrom).offset().left-$(window).scrollLeft()).toString()+'px',
							  'top':(row.offset().top-$(window).scrollTop()-vars.guidefrom.outerHeight(true)).toString()+'px'
							});
							vars.guideto.text(vars.fromdate.calc(today.toString()+' day').format('m-d')).show().css({
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
				/* place the segment data */
				if (vars.levels.lookup)
				{
					for (var i=0;i<heads.values.length;i++)
					{
						var filter=$.grep(records,function(item,index){
							return item[vars.levels.lookup].value==heads.values[i][vars.levels.relatedkey].value;
						});
						/* rebuild view */
						functions.build(filter,heads.values[i],i);
					}
				}
				else
				{
					for (var i=0;i<heads.values.length;i++)
					{
						var filter=$.grep(records,function(item,index){
							var exists=0;
							$.each(heads.values[i],function(key,values){if (item[key].value==values.field) exists++;});
							return exists==Object.keys(heads.values[i]).length;
						});
						/* rebuild view */
						functions.build(filter,heads.values[i],i);
					}
				}
				/* merge row */
				var rowspans=[];
				for (var i=0;i<vars.segmentkeys.length;i++) rowspans.push({cache:'',index:-1,span:0});
				$.each(vars.table.contents.find('tr'),function(index){
					var row=vars.table.contents.find('tr').eq(index);
					for (var i=0;i<vars.segmentkeys.length;i++)
					{
						var cell=row.find('td').eq(i);
						if (rowspans[i].cache!=cell.find('p').text())
						{
							if (rowspans[i].index!=-1)
							{
								vars.table.contents.find('tr').eq(rowspans[i].index).find('td').eq(i).attr('rowspan',rowspans[i].span);
								for (var i2=rowspans[i].index+1;i2<index;i2++) vars.table.contents.find('tr').eq(i2).find('td').eq(i).hide();
							}
							rowspans[i].cache=cell.find('p').text();
							rowspans[i].index=index;
							rowspans[i].span=0;
							for (var i2=i+1;i2<vars.segmentkeys.length;i2++)
							{
								cell=row.find('td').eq(i2);
								if (rowspans[i2].index!=-1)
								{
									vars.table.contents.find('tr').eq(rowspans[i2].index).find('td').eq(i2).attr('rowspan',rowspans[i2].span);
									for (var i3=rowspans[i2].index+1;i3<index;i3++) vars.table.contents.find('tr').eq(i3).find('td').eq(i2).hide();
								}
								rowspans[i2].cache=cell.find('p').text();
								rowspans[i2].index=index;
								rowspans[i2].span=0;
							}
						}
						rowspans[i].span++;
					}
				});
				var index=vars.table.contents.find('tr').length-1;
				var row=vars.table.contents.find('tr').last();
				for (var i=0;i<vars.segmentkeys.length;i++)
				{
					var cell=row.find('td').eq(i);
					if (rowspans[i].cache==cell.find('p').text() && rowspans[i].index!=index)
					{
						vars.table.contents.find('tr').eq(rowspans[i].index).find('td').eq(i).attr('rowspan',rowspans[i].span);
						for (var i2=rowspans[i].index+1;i2<index+1;i2++) vars.table.contents.find('tr').eq(i2).find('td').eq(i).hide();
					}
				}
				$.each(vars.table.contents.find('tr'),function(index){
					var height=0;
					var row=vars.table.contents.find('tr').eq(index);
					$.each($('.ganttchart-merge',row),function(){
						if (height<$(this).find('.ganttchart-merge-p').outerHeight(true)) height=$(this).find('.ganttchart-merge-p').outerHeight(true);
					});
					$.each($('.ganttchart-merge',row),function(){
						$(this).css({'padding-top':height.toString()+'px'});
					});
				});
			});
		},
		/* reload datas */
		loaddatas:function(appkey,callback){
			var sort='';
			var query=kintone.app.getQueryCondition();
			var body={
				app:appkey,
				query:'',
				fields:vars.fields
			};
			query+=((query.length!=0)?' and ':'');
			query+='(';
			query+='('+vars.config['fromdate']+'>"'+vars.fromdate.calc('-1 day').format('Y-m-d')+'" and '+vars.config['fromdate']+'<"'+vars.todate.calc('1 day').format('Y-m-d')+'")';
			query+=' or ';
			query+='('+vars.config['todate']+'>"'+vars.fromdate.calc('-1 day').format('Y-m-d')+'" and '+vars.config['todate']+'<"'+vars.todate.calc('1 day').format('Y-m-d')+'")';
			query+=' or ';
			query+='('+vars.config['fromdate']+'<"'+vars.fromdate.format('Y-m-d')+'" and '+vars.config['todate']+'>"'+vars.todate.format('Y-m-d')+'")';
			query+=')';
			sort=' order by ';
			$.each(vars.segments,function(key,values){sort+=key+' asc,';});
			sort+=vars.config['fromdate']+' asc limit '+limit.toString()+' offset '+vars.offset[appkey].toString();
			body.query+=query+sort;
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				Array.prototype.push.apply(vars.apps[appkey],resp.records);
				vars.offset[appkey]+=limit;
				if (resp.records.length==limit) functions.loaddatas(appkey,callback);
				else callback();
			},function(error){});
		},
		/* reload datas of level */
		loadlevels:function(callback){
			var body={
				app:vars.levels.app,
				query:vars.fieldinfos[vars.levels.lookup].lookup.filterCond
			};
			body.query+=' order by ';
			for (var i=0;i<vars.segmentkeys.length;i++) body.query+=vars.segmentkeys[i]+' asc,';
			body.query=body.query.replace(/,$/g,'');
			body.query+=' limit '+limit.toString()+' offset '+vars.offset[vars.levels.app].toString();
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				Array.prototype.push.apply(vars.apps[vars.levels.app],resp.records);
				vars.offset[vars.levels.app]+=limit;
				if (resp.records.length==limit) functions.loadlevels(callback);
				else callback();
			},function(error){});
		},
		/* reload datas of segment */
		loadsegments:function(param,callback){
			var body={
				app:param.app,
				query:vars.fieldinfos[param.code].lookup.filterCond+' order by '+param.field+' '+param.sort+' limit '+limit.toString()+' offset '+param.offset.toString()
			};
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				var records=[]
				$.each(resp.records,function(index,values){
					records.push({display:values[param.display].value,field:values[param.field].value});
				});
				Array.prototype.push.apply(param.records,records);
				param.offset+=limit;
				if (resp.records.length==limit) functions.loadsegments(param,callback);
				else {param.loaded=1;callback(param);}
			},function(error){});
		},
		/* check for completion of load */
		checkloaded:function(){
			var loaded=0;
			var total=0;
			$.each(vars.segments,function(key,values){loaded+=values.loaded;total++;});
			/* reload view */
			if (loaded==total) functions.load();
		}
	};
	/*---------------------------------------------------------------
	 mouse events
	---------------------------------------------------------------*/
	$(window).on('mousemove',function(e){
		/* move balloon */
		$('div.ganttchart-balloon').css({
		  'left':e.clientX,
		  'top':e.clientY
		});
	});
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* check viewid */
		if (event.viewId!=vars.config.monthganttchart) return;
		/* initialize valiable */
		var container=$('div#ganttchart-container').css({'padding-bottom':'100px'});
		var feed=$('<div class="ganttchart-dayfeed">');
		var fromdate=$('<span id="date" class="customview-span">');
		var frombutton=$('<button id="datepick" class="customview-button calendar-button">');
		var fromprev=$('<button id="prev" class="customview-button prev-button">');
		var fromnext=$('<button id="next" class="customview-button next-button">');
		var todate=$('<span id="date" class="customview-span">');
		var tobutton=$('<button id="datepick" class="customview-button calendar-button">');
		var toprev=$('<button id="prev" class="customview-button prev-button">');
		var tonext=$('<button id="next" class="customview-button next-button">');
		/* append elements */
		feed.append(fromprev);
		feed.append(fromdate);
		feed.append(frombutton);
		feed.append(fromnext);
		feed.append($('<span class="customview-span">').text(' ~ '));
		feed.append(toprev);
		feed.append(todate);
		feed.append(tobutton);
		feed.append(tonext);
		if ($('.ganttchart-dayfeed').size()) $('.ganttchart-dayfeed').remove();
		kintone.app.getHeaderMenuSpaceElement().appendChild(feed[0]);
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
		vars.datecalc=$.ganttchartdatecalc(vars.fromdate,vars.todate);
		fromdate.text(vars.fromdate.format('Y-m'));
		todate.text(vars.todate.format('Y-m'));
		/* month pickup button */
		vars.fromcalendar=$('body').calendar({
			selected:function(target,value){
				vars.fromdate=new Date(value.dateformat()).calc('first-of-month');
				vars.datecalc=$.ganttchartdatecalc(vars.fromdate,vars.todate);
				fromdate.text(vars.fromdate.format('Y-m'));
				/* reload view */
				functions.load();
			}
		});
		frombutton.on('click',function(){vars.fromcalendar.show({activedate:vars.fromdate});});
		vars.tocalendar=$('body').calendar({
			selected:function(target,value){
				vars.todate=new Date(value.dateformat()).calc('first-of-month').calc('1 month').calc('-1 day');
				vars.datecalc=$.ganttchartdatecalc(vars.fromdate,vars.todate);
				todate.text(vars.todate.format('Y-m'));
				/* reload view */
				functions.load();
			}
		});
		tobutton.on('click',function(){vars.tocalendar.show({activedate:vars.todate});});
		/* month feed button */
		$.each([fromprev,fromnext],function(){
			$(this).on('click',function(){
				var months=($(this).attr('id')=='next')?1:-1;
				vars.fromdate=vars.fromdate.calc(months+' month');
				vars.datecalc=$.ganttchartdatecalc(vars.fromdate,vars.todate);
				fromdate.text(vars.fromdate.format('Y-m'));
				/* reload view */
				functions.load();
			});
		});
		$.each([toprev,tonext],function(){
			$(this).on('click',function(){
				var months=($(this).attr('id')=='next')?1:-1;
				vars.todate=vars.todate.calc('first-of-month').calc(months+' month').calc('1 month').calc('-1 day');
				vars.datecalc=$.ganttchartdatecalc(vars.fromdate,vars.todate);
				todate.text(vars.todate.format('Y-m'));
				/* reload view */
				functions.load();
			});
		});
		/* setup colors value */
		vars.colors=vars.config['segmentcolors'].split(',');
		/* setup displays value */
		vars.displays=vars.config['displays'].split(',');
		/* setup lookups value */
		vars.levels=JSON.parse(vars.config['levels']);
		/* setup segments value */
		vars.segments=JSON.parse(vars.config['segment']);
		if (vars.levels.lookup) vars.segmentkeys=vars.levels.levels;
		else vars.segmentkeys=Object.keys(vars.segments);
		/* get fields of app */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.fields=['$id'];
			vars.fieldinfos=resp.properties;
			$.each(resp.properties,function(key,values){
				vars.fields.push(values.code);
			});
			/* get datas of segment */
			if (vars.levels.lookup)
			{
				vars.apps[vars.levels.app]=[];
				vars.offset[vars.levels.app]=0;
				functions.loadlevels(function(){functions.load();});
			}
			else
			{
				$.each(vars.segments,function(key,values){
					var param=values;
					param.code=key;
					param.loaded=0;
					param.offset=0;
					param.records=[];
					if (param.app.length!=0) functions.loadsegments(param,function(res){functions.checkloaded();});
					else
					{
						param.records=[resp.properties[key].options.length];
						$.each(resp.properties[key].options,function(key,values){
							param.records[values.index]={display:values.label,field:values.label};
						});
						param.loaded=1;
					}
				});
				functions.checkloaded();
			}
		},function(error){});
		return event;
	});
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* get query strings */
		var queries=$.queries();
		if (vars.config['fromdate'] in queries) event.record[vars.config['fromdate']].value=queries[vars.config['fromdate']];
		if (vars.config['todate'] in queries) event.record[vars.config['todate']].value=queries[vars.config['todate']];
		vars.levels=JSON.parse(vars.config['levels']);
		vars.segments=JSON.parse(vars.config['segment']);
		if (vars.levels.lookup)
		{
			if (vars.levels.lookup in queries)
			{
				event.record[vars.levels.lookup].value=queries[vars.levels.lookup];
				event.record[vars.levels.lookup].lookup=true;
			}
		}
		else
		{
			$.each(vars.segments,function(key,values){
				if (key in queries)
				{
					event.record[key].value=queries[key];
					event.record[key].lookup=true;
				}
			});
		}
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
