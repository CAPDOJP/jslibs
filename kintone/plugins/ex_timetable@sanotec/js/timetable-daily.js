/*
*--------------------------------------------------------------------
* jQuery-Plugin "timetable-daily"
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
		fromcalendar:null,
		tocalendar:null,
		table:null,
		apps:{},
		config:{},
		offset:{},
		fields:[],
		segments:[]
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
		build:function(filter,segments,colorindex){
			var color=colorindex%12;
			/* insert row */
			vars.table.insertrow(null,function(row){
				var baserow=row;
				for (var i=0;i<segments.length;i++) baserow.find('td').eq(i).html('<p class="customview-p">'+segments[i]+'</p>');
				if (filter.length!=0)
				{
					for (var i=0;i<filter.length;i++)
					{
						/* create cell */
						var datecalc=$.timetabledatecalc(
							new Date(filter[i][vars.config['fromtime']].value),
							new Date(filter[i][vars.config['totime']].value),
							null,
							new Date(vars.fromdate.format('Y-m-d')+'T00:00:00+0900')
						);
						if (datecalc.to.hour<parseInt(vars.config['starthour'])-1) continue;
						var from=(datecalc.from.hour-parseInt(vars.config['starthour']))*parseInt(vars.config['scale'])+Math.floor(datecalc.from.minute/(60/parseInt(vars.config['scale'])));
						var to=(datecalc.to.hour-parseInt(vars.config['starthour']))*parseInt(vars.config['scale'])+Math.ceil(datecalc.to.minute/(60/parseInt(vars.config['scale'])))-1;
						var fromindex=0;
						var toindex=0;
						if (from<0) from=0;
						from+=vars.segments.length;
						to+=vars.segments.length;
						/* check cell merged */
						var isinsertrow=true;
						var mergerow=baserow;
						var rowindex=vars.table.contents.find('tr').index(baserow);
						var rowspan=(parseInt('0'+baserow.find('td').eq(0).attr('rowspan'))!=0)?parseInt('0'+baserow.find('td').eq(0).attr('rowspan')):1;
						for (var i2=rowindex;i2<rowindex+rowspan;i2++)
						{
							mergerow=vars.table.contents.find('tr').eq(i2);
							fromindex=vars.table.mergecellindex(mergerow,from);
							toindex=vars.table.mergecellindex(mergerow,to);
							if (!mergerow.find('td').eq(fromindex).hasClass('timetable-daily-merge') && !mergerow.find('td').eq(toindex).hasClass('timetable-daily-merge')) {isinsertrow=false;break;}
						}
						/* merge cell */
						if (isinsertrow)
						{
							vars.table.insertrow(vars.table.contents.find('tr').eq(rowindex+rowspan-1),function(row){
								mergerow=row;
								fromindex=vars.table.mergecellindex(mergerow,from);
								toindex=vars.table.mergecellindex(mergerow,to);
								functions.mergeaftervalue(mergerow,fromindex,toindex,filter[i]);
								rowspan++;
								/* check row merged */
								for (var i2=0;i2<segments.length;i2++)
								{
									baserow.find('td').eq(i2).attr('rowspan',rowspan);
									mergerow.find('td').eq(i2).html(baserow.find('td').eq(i2).html()).hide();
								}
								/* setup merge class */
								$.each(row.find('td'),function(index){
									$(this).addClass('timetable-daily-merge'+color);
								})
							});
						}
						else functions.mergeaftervalue(mergerow,fromindex,toindex,filter[i]);
					}
				}
				/* setup merge class */
				$.each(row.find('td'),function(index){
					$(this).addClass('timetable-daily-merge'+color);
				})
			});
		},
		/* setup merge cell value */
		mergeaftervalue:function(row,from,to,filter){
			var cell=row.find('td').eq(from);
			vars.table.mergecell(
				cell,
				from,
				to
			);
			/* cell value switching */
			var inner=$('<p>').addClass('timetable-daily-merge-p');
			inner.html($.fieldvalue(filter[vars.config['display']]));
			cell.append(inner);
			$.each(filter,function(key,values){
				if (values!=null)
					if (values.value!=null)
						cell.append($('<input type="hidden">').attr('id',key).val(values.value));
			})
			/* append balloon */
			var balloon=$('<div class="timetable-daily-balloon">');
			$('body').append(
				balloon.css({
					'z-index':(100+$('div.timetable-daily-balloon').length).toString()
				})
				.html('<p class="customview-p">'+$.fieldvalue(filter[vars.config['tooltip']])+'</p>')
			);
			/* setup cell datas */
			$.data(cell[0],'balloon',balloon);
			/* mouse events */
			cell.on({
				'click':function(){window.location.href='https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/show#record='+cell.find('input#\\$id').val()+'&mode=show';},
				'mouseenter':function(){$.data($(this)[0],'balloon').addClass('timetable-daily-balloon-show');},
				'mouseleave':function(){$.data($(this)[0],'balloon').removeClass('timetable-daily-balloon-show');}
			});
		},
		/* reload view */
		load:function(){
			/* after apprecords acquisition,rebuild view */
			vars.apps[kintone.app.getId()]=null;
			vars.offset[kintone.app.getId()]=0;
			functions.loaddatas(kintone.app.getId(),function(){
				var records=vars.apps[kintone.app.getId()];
				var segments=[];
				var datecalc={};
				var columns=0;
				/* clear balloon */
				$('div.timetable-daily-balloon').remove();
				/* create segments */
				$.each(records,function(index){
					var segment='';
					for (var i=0;i<vars.segments.length;i++) segment+=records[index][vars.segments[i]].value+',';
					segment=segment.replace(/,$/g,'');
					if (segments.indexOf(segment)<0) segments.push(segment);
					datecalc=$.timetabledatecalc(vars.fromdate,new Date(records[index][vars.config['totime']].value),vars.config['starthour']);
					if (columns<datecalc.diffhours) columns=datecalc.diffhours;
				});
				/* create table */
				var container=$('div#timetable-container').empty();
				var head=$('<tr></tr><tr></tr>');
				var template=$('<tr>');
				var spacer=$('<span>');
				for (var i=0;i<vars.segments.length;i++)
				{
					head.eq(0).append($('<th class="timetable-daily-cellhead">'));
					head.eq(1).append($('<th class="timetable-daily-cellhead">'));
					template.append($('<td class="timetable-daily-cellhead">'));
				}
				if (vars.config['scalefixed']=='1') spacer.css({'display':'block','height':'1px','width':vars.config['scalefixedwidth']+'px'});
				/* insert column */
				for (var i=0;i<columns;i++)
				{
					head.eq(0).append($('<th colspan="'+vars.config['scale']+'">').text(i+parseInt(vars.config['starthour'])));
					for (var i2=0;i2<parseInt(vars.config['scale']);i2++)
					{
						if (vars.config['scalefixed']=='1') head.eq(1).append($('<th>').append(spacer.clone(false)));
						else head.eq(1).append($('<th>'));
						template.append($('<td>'));
					}
				}
				if (records.length!=0)
				{
					vars.table=$('<table id="timetable" class="customview-table timetable-daily '+((vars.config['scalefixed']=='1')?'cellfixed':'')+'">').mergetable({
						container:container,
						head:head,
						template:template,
						merge:false,
						mergeclass:'timetable-daily-merge'
					});
					/* place the segment data */
					for (var i=0;i<segments.length;i++)
					{
						var segment=segments[i].split(',');
						var filter=$.grep(records,function(item,index){
							var exists=0;
							for (var i2=0;i2<vars.segments.length;i2++) if (item[vars.segments[i2]].value==segment[i2]) exists++;
							return exists==vars.segments.length;
						});
						/* rebuild view */
						functions.build(filter,segment,i);
					}
					/* merge row */
					var rowspans=[];
					for (var i=0;i<vars.segments.length;i++) rowspans.push({cache:'',index:0,rowspan:0});
					$.each(vars.table.contents.find('tr'),function(index){
						var row=vars.table.contents.find('tr').eq(index);
						for (var i=0;i<vars.segments.length;i++)
						{
							var cell=row.find('td').eq(i);
							if (rowspans[i].cache!=cell.find('p').text())
							{
								if (rowspans[i].index!=0)
								{
									vars.table.contents.find('tr').eq(rowspans[i].index).find('td').eq(i).attr('rowspan',rowspans[i].rowspan);
									for (var i2=rowspans[i].index+1;i2<index;i2++) vars.table.contents.find('tr').eq(i2).find('td').eq(i).hide();
								}
								rowspans[i].cache=cell.find('p').text();
								rowspans[i].index=index;
								rowspans[i].rowspan=0;
							}
							rowspans[i].rowspan+=(parseInt('0'+cell.attr('rowspan'))!=0)?parseInt('0'+cell.attr('rowspan'))-1:1;
						}
					});
					var index=vars.table.contents.find('tr').length-1;
					var row=vars.table.contents.find('tr').last();
					for (var i=0;i<vars.segments.length;i++)
					{
						var cell=row.find('td').eq(i);
						if (rowspans[i].cache==cell.find('p').text() && rowspans[i].index!=index)
						{
							vars.table.contents.find('tr').eq(rowspans[i].index).find('td').eq(i).attr('rowspan',rowspans[i].rowspan);
							for (var i2=rowspans[i].index+1;i2<index+1;i2++) vars.table.contents.find('tr').eq(i2).find('td').eq(i).hide();
						}
					}
				}
				else swal('Error!','条件に該当するレコードが見つかりませんでした。','error');
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
			query+=vars.config['fromtime']+'>"'+vars.fromdate.calc('-1 day').format('Y-m-d')+'T23:59:59+0900"';
			query+=' and '+vars.config['fromtime']+'<"'+vars.todate.calc('1 day').format('Y-m-d')+'T00:00:00+0900"';
			sort=' order by ';
			for (var i=0;i<vars.segments.length;i++) sort+=vars.segments[i]+' asc,';
			sort+=vars.config['fromtime']+' asc limit '+limit.toString()+' offset '+vars.offset[appkey].toString();
			body.query+=query+sort;
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				if (vars.apps[appkey]==null) vars.apps[appkey]=resp.records;
				else Array.prototype.push.apply(vars.apps[appkey],resp.records);
				vars.offset[appkey]+=limit;
				if (resp.records.length==limit) functions.loaddatas(appkey,callback);
				else callback();
			},function(error){});
		}
	};
	/*---------------------------------------------------------------
	 mouse events
	---------------------------------------------------------------*/
	$(window).on('mousemove',function(e){
		/* move balloon */
		$('div.timetable-daily-balloon').css({
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
		if (vars.config['fromtime'] in queries)
		{
			vars.fromdate=new Date(queries[vars.config['fromtime']]);
			vars.todate=new Date(queries[vars.config['fromtime']]);
		}
		/* initialize valiable */
		var container=$('div#timetable-container');
		var feed=$('<div class="timetable-dayfeed">');
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
		kintone.app.getHeaderMenuSpaceElement().innerHTML='';
		kintone.app.getHeaderMenuSpaceElement().appendChild(feed[0]);
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
		fromdate.text(vars.fromdate.format('Y-m-d'));
		todate.text(vars.todate.format('Y-m-d'));
		/* day pickup button */
		vars.fromcalendar=$('body').calendar({
			selected:function(target,value){
				vars.fromdate=new Date(value);
				fromdate.text(value);
				/* reload view */
				functions.load();
			}
		});
		frombutton.on('click',function(){vars.fromcalendar.show({activedate:vars.fromdate});});
		vars.tocalendar=$('body').calendar({
			selected:function(target,value){
				vars.todate=new Date(value);
				todate.text(value);
				/* reload view */
				functions.load();
			}
		});
		tobutton.on('click',function(){vars.tocalendar.show({activedate:vars.todate});});
		/* day feed button */
		$.each([fromprev,fromnext],function(){
			$(this).on('click',function(){
				var days=($(this).attr('id')=='next')?1:-1;
				vars.fromdate=vars.fromdate.calc(days+' day');
				fromdate.text(vars.fromdate.format('Y-m-d'));
				/* reload view */
				functions.load();
			});
		});
		$.each([toprev,tonext],function(){
			$(this).on('click',function(){
				var days=($(this).attr('id')=='next')?1:-1;
				vars.todate=vars.todate.calc(days+' day');
				todate.text(vars.todate.format('Y-m-d'));
				/* reload view */
				functions.load();
			});
		});
		/* setup segments value */
		vars.segments=vars.config['segment'].split(',');
		/* get fields of app */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.fields=['$id'];
			$.each(resp.properties,function(key,values){vars.fields.push(values.code);});
			/* reload view */
			functions.load();
		},function(error){});
		return;
	});
})(jQuery,kintone.$PLUGIN_ID);