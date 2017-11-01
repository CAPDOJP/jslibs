/*
*--------------------------------------------------------------------
* jQuery-Plugin "timetable-daily"
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
		date:new Date(),
		calendar:null,
		graphlegend:null,
		table:null,
		apps:{},
		lectures:{},
		config:{},
		offset:{},
		lecturekeys:[],
		fields:[],
		tooltips:[],
		week:['日','月','火','水','木','金','土']
	};
	var events={
		lists:[
			'app.record.index.show'
		]
	};
	var limit=500;
	var functions={
		/* rebuild view */
		build:function(filter){
			/* insert row */
			vars.table.insertrow(null,function(row){
				var baserow=row;
				if (filter.length!=0)
				{
					var student=$.grep(vars.apps[vars.config['student']],function(item,index){return (item['$id'].value==filter[0]['studentcode'].value);})[0];
					var grade=$.grep(vars.apps[vars.config['grade']],function(item,index){return (item['code'].value==student['gradecode'].value);})[0];
					baserow.find('td').eq(0).append(
						$('<p class="timetable-student">')
						.append(
							$('<span>').addClass('grade')
							.css({'background-color':'#'+grade['color'].value})
							.text(grade['name'].value)
						)
						.append(
							$('<span>').addClass('name')
							.text(filter[0]['studentname'].value)
						)
					);
					for (var i=0;i<filter.length;i++)
					{
						/* create cell */
						var color=vars.lectures[filter[i]['appcode'].value].color;
						var fromtime=new Date((vars.date.format('Y-m-d')+'T'+filter[i]['starttime'].value+':00+09:00').dateformat());
						var totime=new Date(fromtime.getTime()+(parseFloat(filter[i]['hours'].value)*1000*60*60));
						var from=(fromtime.getHours())*parseInt(vars.config['scale'])+Math.floor(fromtime.getMinutes()/(60/parseInt(vars.config['scale'])));
						var to=(totime.getHours())*parseInt(vars.config['scale'])+Math.ceil(totime.getMinutes()/(60/parseInt(vars.config['scale'])))-1;
						var fromindex=0;
						var toindex=0;
						if (from<parseInt(vars.config['starthour'])*parseInt(vars.config['scale'])) from=parseInt(vars.config['starthour'])*parseInt(vars.config['scale']);
						if (to<parseInt(vars.config['starthour'])*parseInt(vars.config['scale'])) continue;
						if (to>(parseInt(vars.config['endhour'])+1)*parseInt(vars.config['scale'])-1) to=(parseInt(vars.config['endhour'])+1)*parseInt(vars.config['scale'])-1;
						from++;
						to++;
						/* check cell merged */
						var isinsertrow=true;
						var mergerow=baserow;
						for (var i2=vars.table.contents.find('tr').index(baserow);i2<vars.table.contents.find('tr').length;i2++)
						{
							mergerow=vars.table.contents.find('tr').eq(i2);
							fromindex=vars.table.mergecellindex(mergerow,from);
							toindex=vars.table.mergecellindex(mergerow,to);
							if (!mergerow.find('td').eq(fromindex).hasClass('timetable-daily-merge') && !mergerow.find('td').eq(toindex).hasClass('timetable-daily-merge')) {isinsertrow=false;break;}
						}
						/* merge cell */
						if (isinsertrow)
						{
							vars.table.insertrow(null,function(row){
								fromindex=vars.table.mergecellindex(row,from);
								toindex=vars.table.mergecellindex(row,to);
								functions.mergeaftervalue(row,fromindex,toindex,filter[i],color);
								/* check row heads */
								row.find('td').eq(0).html(baserow.find('td').eq(0).html());
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
			cell.append(
				$('<p>')
				.css({'background-color':'#'+color})
				.html('&nbsp;')
			);
			$.each(filter,function(key,values){
				if (values!=null)
					if (values.value!=null)
						cell.append($('<input type="hidden">').attr('id',key).val(values.value));
			});
			/* append balloon */
			var balloon=$('<div class="timetable-balloon">');
			var inner='';
			inner+='<p class="timetable-tooltip">';
			for (var i=0;i<vars.tooltips.length;i++) inner+='<span>'+filter[vars.tooltips[i]].value+'</span>';
			inner+='</p>';
			$('body').append(
				balloon.css({
					'z-index':(vars.apps[kintone.app.getId()].length+$('div.timetable-balloon').length+1).toString()
				})
				.html(inner)
			);
			/* setup cell datas */
			$.data(cell[0],'balloon',balloon);
			/* mouse events */
			cell.on({
				'mouseenter':function(){$.data($(this)[0],'balloon').addClass('timetable-balloon-show');},
				'mouseleave':function(){$.data($(this)[0],'balloon').removeClass('timetable-balloon-show');}
			});
		},
		/* reload view */
		load:function(){
			/* after apprecords acquisition,rebuild view */
			vars.apps[kintone.app.getId()]=null;
			vars.offset[kintone.app.getId()]=0;
			functions.loaddatas(kintone.app.getId(),function(){
				var records=vars.apps[kintone.app.getId()];
				var heads=[];
				/* append recoed of schedule */
				if (vars.date>new Date().calc('-1 day'))
					Array.prototype.push.apply(records,$.createschedule(
						vars.apps[vars.config['student']],
						vars.apps[vars.lecturekeys[0]],
						records,
						vars.lecturekeys[0],
						vars.lectures[vars.lecturekeys[0]].name,
						vars.week,
						vars.date
					));
				/* sort */
				records.sort(function(a,b){
					if(a['starttime'].value<b['starttime'].value) return -1;
					if(a['starttime'].value>b['starttime'].value) return 1;
					return 0;
				});
				/* clear balloon */
				$('div.timetable-balloon').remove();
				/* create rowheads */
				$.each(records,function(index){
					if ($.inArray(records[index]['studentcode'].value,heads)<0) heads.push(records[index]['studentcode'].value);
				});
				/* initialize table */
				vars.table.clearrows();
				/* place the segment data */
				for (var i=0;i<heads.length;i++)
				{
					var filter=$.grep(records,function(item,index){
						var exists=0;
						if (item['studentcode'].value==heads[i]) exists++;
						if (item['transfered'].value==0) exists++;
						if (item['transferpending'].value==0) exists++;
						return exists==3;
					});
					/* rebuild view */
					functions.build(filter);
				}
				/* merge row */
				var rowspans={cache:'',index:-1,span:0};
				$.each(vars.table.contents.find('tr'),function(index){
					var row=vars.table.contents.find('tr').eq(index);
					var cell=row.find('td').eq(0);
					if (rowspans.cache!=cell.find('p').text())
					{
						if (rowspans.index!=-1)
						{
							vars.table.contents.find('tr').eq(rowspans.index).find('td').eq(0).attr('rowspan',rowspans.span);
							for (var i=rowspans[i].index+1;i<index;i++) vars.table.contents.find('tr').eq(i).find('td').eq(0).hide();
						}
						rowspans.cache=cell.find('p').text();
						rowspans.index=index;
						rowspans.span=0;
					}
					rowspans.span++;
				});
				var index=vars.table.contents.find('tr').length-1;
				var row=vars.table.contents.find('tr').last();
				var cell=row.find('td').eq(0);
				if (rowspans.cache==cell.find('p').text() && rowspans.index!=index)
				{
					vars.table.contents.find('tr').eq(rowspans.index).find('td').eq(0).attr('rowspan',rowspans.span);
					for (var i=rowspans.index+1;i<index+1;i++) vars.table.contents.find('tr').eq(i).find('td').eq(0).hide();
				}
			});
		},
		/* reload datas */
		loaddatas:function(appkey,callback){
			var query=kintone.app.getQueryCondition();
			var body={
				app:appkey,
				query:'',
				fields:vars.fields
			};
			query+=((query.length!=0)?' and ':'');
			query+='date="'+vars.date.format('Y-m-d')+'"';
			query+=' order by starttime asc limit '+limit.toString()+' offset '+vars.offset[appkey].toString();
			body.query+=query;
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				if (vars.apps[appkey]==null) vars.apps[appkey]=resp.records;
				else Array.prototype.push.apply(vars.apps[appkey],resp.records);
				vars.offset[appkey]+=limit;
				if (resp.records.length==limit) functions.loaddatas(appkey,callback);
				else callback();
			},function(error){
				swal('Error!',error.message,'error');
			});
		}
	};
	/*---------------------------------------------------------------
	 mouse events
	---------------------------------------------------------------*/
	$(window).on('mousemove',function(e){
		/* move balloon */
		$('div.timetable-balloon').css({
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
		if (event.viewId!=vars.config.datetimetable) return;
		/* get query strings */
		var queries=$.queries();
		if ('date' in queries) vars.date=new Date(queries['date'].dateformat());
		/* initialize valiable */
		var container=$('div#timetable-container');
		var feed=$('<div class="timetable-dayfeed">');
		var date=$('<span id="date" class="customview-span">');
		var button=$('<button id="datepick" class="customview-button calendar-button">');
		var prev=$('<button id="prev" class="customview-button prev-button">');
		var next=$('<button id="next" class="customview-button next-button">');
		var splash=$('<div id="splash">');
		vars.graphlegend=$('<div class="timetable-graphlegend">');
		splash.append(
			$('<p>')
			.append($('<span>').text('now loading'))
			.append($('<span class="dot progress1">').text('.'))
			.append($('<span class="dot progress2">').text('.'))
			.append($('<span class="dot progress3">').text('.'))
			.append($('<span class="dot progress4">').text('.'))
			.append($('<span class="dot progress5">').text('.'))
		);
		/* append elements */
		feed.append(prev);
		feed.append(date);
		feed.append(button);
		feed.append(next);
		kintone.app.getHeaderMenuSpaceElement().innerHTML='';
		kintone.app.getHeaderMenuSpaceElement().appendChild(feed[0]);
		$('body').append(splash);
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
		date.text(vars.date.format('Y-m-d'));
		/* day pickup button */
		vars.calendar=$('body').calendar({
			selected:function(target,value){
				vars.date=new Date(value.dateformat());
				date.text(value);
				/* reload view */
				functions.load();
			}
		});
		button.on('click',function(){
			vars.calendar.show({activedate:vars.date});
		});
		/* day feed button */
		$.each([prev,next],function(){
			$(this).on('click',function(){
				var days=($(this).attr('id')=='next')?1:-1;
				vars.date=vars.date.calc(days+' day');
				date.text(vars.date.format('Y-m-d'));
				/* reload view */
				functions.load();
			});
		});
		/* setup lectures value */
		vars.lectures=JSON.parse(vars.config['lecture']);
		vars.lecturekeys=Object.keys(vars.lectures);
		/* setup tooltips value */
		vars.tooltips=vars.config['tooltip'].split(',');
		/* check app fields */
		var counter=0;
		var param=[];
		$.each(vars.lectures,function(key,values){
			param.push({
				app:(key==vars.lecturekeys[0])?key:'',
				appname:values.name,
				limit:limit,
				offset:0,
				records:[],
				isstudent:false
			});
		});
		param.push({
			app:vars.config['grade'],
			appname:'学年',
			limit:limit,
			offset:0,
			records:[],
			isstudent:false
		});
		param.push({
			app:vars.config['student'],
			appname:'生徒情報',
			limit:limit,
			offset:0,
			records:[],
			isstudent:true
		});
		$.loadapps(counter,param,splash,function(){
			splash.addClass('hide');
			for (var i=0;i<param.length;i++) vars.apps[param[i].app]=param[i].records;
			/* append graph legend */
			$.each(vars.lectures,function(key,values){
				vars.graphlegend
				.append($('<span class="customview-span timetable-graphlegend-color">').css({'background-color':'#'+values.color}))
				.append($('<span class="customview-span timetable-graphlegend-title">').text(values.name));
			});
			container.empty().append(vars.graphlegend);
			/* create table */
			var head=$('<tr></tr><tr></tr>');
			var template=$('<tr>');
			var spacer=$('<span>');
			head.eq(0).append($('<th class="timetable-daily-cellhead">'));
			head.eq(1).append($('<th class="timetable-daily-cellhead">'));
			template.append($('<td class="timetable-daily-cellhead">'));
			if (vars.config['scalefixed']=='1') spacer.css({'display':'block','height':'1px','width':vars.config['scalefixedwidth']+'px'});
			for (var i=0;i<24;i++)
			{
				var hide='';
				if (i<parseInt(vars.config['starthour'])) hide='class="hide"';
				if (i>parseInt(vars.config['endhour'])) hide='class="hide"';
				head.eq(0).append($('<th colspan="'+vars.config['scale']+'" '+hide+'>').text(i));
				for (var i2=0;i2<parseInt(vars.config['scale']);i2++)
				{
					if (vars.config['scalefixed']=='1') head.eq(1).append($('<th '+hide+'>').append(spacer.clone(false)));
					else head.eq(1).append($('<th '+hide+'>'));
					template.append($('<td '+hide+'>'));
				}
			}
			vars.table=$('<table id="timetable" class="customview-table timetable-daily '+((vars.config['scalefixed']=='1')?'cellfixed':'')+'">').mergetable({
				container:container,
				head:head,
				template:template,
				merge:false,
				mergeclass:'timetable-daily-merge'
			});
			/* get fields of app */
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
				vars.fields=['$id'];
				$.each(resp.properties,function(key,values){
					vars.fields.push(values.code);
				});
				if (!$.checkreservefield(resp.properties)) return;
				/* reload view */
				functions.load();
			},
			function(error){
				splash.addClass('hide');
				swal('Error!',error.message,'error');
			});
		});
		return;
	});
})(jQuery,kintone.$PLUGIN_ID);
