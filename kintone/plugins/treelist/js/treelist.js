/*
*--------------------------------------------------------------------
* jQuery-Plugin "treelist"
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
		columns:[],
		excludefields:[],
		excludeviews:[],
		segments:[],
		config:{},
		fieldinfos:{}
	};
	var events={
		lists:[
			'app.record.index.show'
		]
	};
	var limit=500;
	var functions={
		/* check for completion of load */
		checkloaded:function(){
			var loaded=0;
			var total=0;
			for (var i=0;i<vars.segments.length;i++)
			{
				loaded+=vars.segments[i].loaded;
				total++;
			}
			/* reload view */
			if (loaded==total) functions.load();
		},
		/* reload view */
		load:function(){
			var header=$('<tr>');
			var rows=$('<tbody>');
			var template=$('<tr>');
			var segments={
				index:0,
				prev:1,
				total:1,
				values:[]
			};
			/* create segment datas */
			for (var i=0;i<vars.segments.length;i++) segments.total*=vars.segments[i].records.length;
			for (var i=0;i<segments.total;i++) segments.values.push({});
			for (var i=0;i<vars.segments.length;i++)
			{
				var segment=vars.segments[i];
				segments.index=0;
				for (var i2=0;i2<segments.prev;i2++)
					for (var i3=0;i3<segment.records.length;i3++)
						for (var i4=0;i4<segments.total/segments.prev/segment.records.length;i4++)
						{
							segments.values[segments.index][segment.code]=segment.records[i3];
							segments.index++;
						}
				segments.prev*=segment.records.length;
			}
			/* append columns */
			for (var i=0;i<vars.columns.length;i++)
			{
				header.append($('<th>').append($('<div>').text(vars.columns[i].fieldinfo.label)));
				if (i<vars.segments.length)
				{
					template.append(
						$('<td id="'+vars.columns[i].fieldinfo.code+'" class="treecell">')
						.append(
							$('<div>').on('click',function(){
								if ($(this).hasClass('open'))
								{
									var cell=$(this).closest('td');
									var row=$(this).closest('tr');
									functions.treeclose($('tr',rows),row,row.index(cell),cell);
									$(this).removeClass('open');
								}
								else
								{
									var cell=$(this).closest('td');
									var row=$(this).closest('tr');
									functions.treeopen($('tr',rows),row,row.index(cell),cell);
									$(this).addClass('open');
								}
							})
						)
						.append($('<input type="hidden" value="">'))
					);
				}
				else template.append($('<td id="'+vars.columns[i].fieldinfo.code+'" class="datacell">').append($('<div>')));
			}
			/* append button column */
			header.append($('<th>').text(''));
			template.append($('<td class="buttoncell">')
				.append($('<button class="customview-button edit-button">').on('click',function(){
					var cell=$(this).closest('td');
					var index=$('input',cell).val();
					if (index.length!=0) window.location.href='https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/show#record='+index;
				}))
				.append($('<input type="hidden" value="">'))
			);
			/* place the segment data */
			for (var i=0;i<segments.values.length;i++)
			{
				var row=template.clone(true);
				$.each(segments.values[i],function(key,values){
					$('input',$('#'+key,row)).val(values.field);
					$('div',$('#'+key,row)).text(values.display);
				});
				/* append row */
				rows.append(row);
			}
			/* merge row */
			var rowspans=[];
			for (var i=0;i<vars.segments.length;i++) rowspans.push({cache:'',cell:null,index:-1,span:0});
			$.each($('tr',rows),function(index){
				var row=$('tr',rows).eq(index);
				for (var i=0;i<vars.segments.length;i++)
				{
					var cell=$('td',row).eq(i);
					if (rowspans[i].cache!=$('input',cell).val())
					{
						if (rowspans[i].index!=-1)
						{
							rowspans[i].cell.attr('rowspan',rowspans[i].span);
							$.data(rowspans[i].cell[0],'rowspan',rowspans[i].span);
							for (var i2=rowspans[i].index+1;i2<index;i2++) $('tr',rows).eq(i2).find('td').eq(i).addClass('disusedcell');
						}
						rowspans[i].cache=$('input',cell).val();
						rowspans[i].cell=cell;
						rowspans[i].index=index;
						rowspans[i].span=0;
						for (var i2=i+1;i2<vars.segments.length;i2++)
						{
							cell=$('td',row).eq(i2);
							if (rowspans[i2].index!=-1)
							{
								rowspans[i2].cell.attr('rowspan',rowspans[i2].span);
								$.data(rowspans[i2].cell[0],'rowspan',rowspans[i2].span);
								for (var i3=rowspans[i2].index+1;i3<index;i3++) $('tr',rows).eq(i3).find('td').eq(i2).addClass('disusedcell');
							}
							rowspans[i2].cache=$('input',cell).val();
							rowspans[i2].cell=cell;
							rowspans[i2].index=index;
							rowspans[i2].span=0;
						}
					}
					rowspans[i].span++;
				}
			});
			var index=$('tr',rows).length-1;
			var row=$('tr',rows).last();
			for (var i=0;i<vars.segments.length;i++)
			{
				var cell=$('td',row).eq(i);
				if (rowspans[i].cache==$('input',cell).val() && rowspans[i].index!=index)
				{
					rowspans[i].cell.attr('rowspan',rowspans[i].span);
					$.data(rowspans[i].cell[0],'rowspan',rowspans[i].span);
					for (var i2=rowspans[i].index+1;i2<index+1;i2++) $('tr',rows).eq(i2).find('td').eq(i).addClass('disusedcell');
				}
			}
			$.each($('tr',rows),function(index){
				var row=$('tr',rows).eq(index);
				if (!$('.treecell',row).eq(0).hasClass('disusedcell')) functions.treeclose($('tr',rows),row,0,$('.treecell',row).eq(0));
			});
			/* append elements */
			$('.box-inner-gaia').empty().append(
				$('<table class="treelist-table">')
				.append($('<thead>').append(header))
				.append(rows)
			);
			$('.gaia-argoui-app-index-pager').hide();
			$('body').append(
				$('<div class="imageviewer">').css({
					'background-color':'rgba(0,0,0,0.5)',
					'display':'none',
					'height':'100%',
					'left':'0px',
					'position':'fixed',
					'top':'0px',
					'width':'100%',
					'z-index':'999999'
				})
				.append($('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/close.png">').css({
					'cursor':'pointer',
					'display':'block',
					'height':'30px',
					'margin':'0px',
					'padding':'0px',
					'position':'absolute',
					'right':'5px',
					'top':'5px',
					'width':'30px'
				}))
				.append($('<img class="treelist-image">').css({
					'bottom':'0',
					'box-shadow':'0px 0px 3px rgba(0,0,0,0.35)',
					'display':'block',
					'height':'auto',
					'left':'0',
					'margin':'auto',
					'max-height':'calc(100% - 80px)',
					'max-width':'calc(100% - 80px)',
					'padding':'0px',
					'position':'absolute',
					'right':'0',
					'top':'0',
					'width':'auto'
				}))
				.on('click',function(){thumbnail.hide();})
			);
		},
		/* reload datas of segment */
		loadsegments:function(param,callback){
			var body={
				app:param.app,
				query:'order by '+param.field+' '+param.sort+' limit '+limit.toString()+' offset '+param.offset.toString()
			};
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				var records=[]
				$.each(resp.records,function(index,values){
					records.push({display:values[param.display].value,field:values[param.field].value});
				});
				Array.prototype.push.apply(param.records,records);
				param.offset+=limit;
				if (resp.records.length==limit) functions.loadsegments(param,callback);
				else
				{
					param.loaded=1;
					callback(param);
				}
			},function(error){});
		},
		treeopen:function(rows,row,column,cell){
			var index=rows.index(row);
			var span=$.data(cell[0],'rowspan');
			$('.datacell,.buttoncell',row).addClass('unvisible');
			for (var i=index+1;i<index+span;i++) $('.datacell,.buttoncell',rows.eq(i)).addClass('hide');
			cell.attr('rowspan',1);
		},
		treeclose:function(rows,row,column,cell){
			var index=rows.index(row);
			var span=$.data(cell[0],'rowspan');
			$('.datacell,.buttoncell',row).addClass('unvisible');
			for (var i=index+1;i<index+span;i++) $('.datacell,.buttoncell',rows.eq(i)).addClass('hide');
			for (var i=column+1;i<vars.segments.length;i++)
			{
				$('.treecell',row).eq(i).addClass('unvisible');
				for (var i2=index+1;i2<index+span;i2++) $('.treecell',rows.eq(i2)).not('.disusedcell').addClass('hide');
				$('.treecell',row).eq(i).attr('rowspan',1);
			}
			cell.attr('rowspan',1);
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		if ('excludefield' in vars.config) vars.excludefields=JSON.parse(vars.config.excludefield);
		if ('excludeview' in vars.config) vars.excludeviews=JSON.parse(vars.config.excludeview);
		if ('segment' in vars.config) vars.segments=JSON.parse(vars.config.segment);
		/* check viewid */
		if ($.inArray(event.viewId.toString(),vars.excludeviews)>-1) return event;
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
			$('div#view-list-data-gaia').css({'margin-top':(headeractions.outerHeight(false)+headerspace.outerHeight(false))+'px','overflow-x':'visible'});
		});
		/* get views of app */
		kintone.api(kintone.api.url('/k/v1/app/views',true),'GET',{app:kintone.app.getId()},function(resp){
			$.each(resp.views,function(key,values){
				if (values.type.toUpperCase()=='LIST' && values.id==event.viewId)
				{
					/* get layout of app */
					kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:kintone.app.getId()},function(resp){
						var tablelayout={};
						(function(layouts){
							for (var i=0;i<layouts.length;i++)
							{
								var layout=layouts[i];
								if (layout.type=='SUBTABLE')
								{
									var fields=[];
									for (var i2=0;i2<layout.fields.length;i2++)
									{
										var fieldinfo=layout.fields[i2];
										/* exclude spacer */
										if ($.inArray(fieldinfo.code,vars.excludefields)<0 && !fieldinfo.elementId) fields.push(fieldinfo.code);
									}
									tablelayout[layout.code]=fields;
								}
							}
						})(resp.layout);
						/* get fields of app */
						kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
							vars.fieldinfos=resp.properties;
							/* append segment columns */
							for (var i=0;i<vars.segments.length;i++)
							{
								vars.columns.push({
									fieldinfo:vars.fieldinfos[vars.segments[i].code],
									isTable:false
								});
							}
							/* append columns */
							for (var i=0;i<values.fields.length;i++)
							{
								var fieldinfo=vars.fieldinfos[values.fields[i]];
								if (fieldinfo.code in tablelayout)
								{
									for (var i2=0;i2<tablelayout[fieldinfo.code].length;i2++)
										vars.columns.push({
											fieldinfo:fieldinfo.fields[tablelayout[fieldinfo.code][i2]],
											isTable:true
										});
								}
								else
								{
									if ($.grep(vars.segments,function(item,index){return item.code==fieldinfo.code;}).length==0)
									{
										vars.columns.push({
											fieldinfo:fieldinfo,
											isTable:false
										});
									}
								}
							}
							/* setup segment */
							for (var i=0;i<vars.segments.length;i++)
							{
								var param=vars.segments[i];
								param.loaded=0;
								param.offset=0;
								param.records=[];
								if (param.app.length!=0) functions.loadsegments(param,function(res){functions.checkloaded();});
								else
								{
									param.records=[vars.fieldinfos[param.code].options.length];
									$.each(vars.fieldinfos[param.code].options,function(key,values){
										param.records[values.index]={display:values.label,field:values.label};
									});
									param.loaded=1;
								}
							}
							functions.checkloaded();
						},function(error){});
					},function(error){});
				}
			})
		});
		return;
	});
})(jQuery,kintone.$PLUGIN_ID);
