/*
*--------------------------------------------------------------------
* jQuery-Plugin "monthlysummary"
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
		year:parseInt(new Date().format('Y')),
		splash:null,
		table:null,
		limit:500,
		offset:0,
		config:{},
		fieldinfos:{},
		views:{},
		summaries:[],
	};
	var events={
		show:[
			'app.record.index.show'
		]
	};
	var functions={
		/* record summary */
		summary:function(row,records,summary){
			var basemonth=new Date((vars.year.toString()+'-'+vars.config.basemonth+'-1').dateformat());
			var tablecode=(function(field){
				if (field) return vars.fieldinfos[field].tablecode;
				return '';
			})(summary.field);
			var totalamount=(function(){
				var res=0;
				for (var i=0;i<records.length;i++)
				{
					switch (summary.pattern)
					{
						case '2':
							if (tablecode)
							{
								for (var i2=0;i2<records[i][tablecode].value.length;i2++)
									res+=parseFloat(records[i][tablecode].value[i2].value[summary.field].value);
							}
							else
							{
								if (records[i][summary.field].value)
									res+=parseFloat(records[i][summary.field].value);
							}
							break;
						case '7':
							res++;
							break;
					}
				}
				return res;
			})();
			var unit=(function(field){
				if (field) return (vars.fieldinfos[field].unit)?vars.fieldinfos[field].unit:'';
				return '';
			})(summary.field);
			var unitposition=(function(field){
				if (field) return (vars.fieldinfos[field].unitPosition)?vars.fieldinfos[field].unitPosition.toUpperCase():'BEFORE';
				return '';
			})(summary.field);
			for (var i=0;i<12;i++)
			{
				var counter=0;
				var amount=0;
				var monthlyamount=0;
				var fromdate=basemonth.calc(i.toString()+' month');
				var todate=fromdate.calc('1 month').calc('-1 day');
				(function(filter){
					var res=[];
					for (var i2=0;i2<filter.length;i2++)
					{
						var match=$.conditionsmatch(filter[i2],vars.fieldinfos,JSON.parse(summary.conditions));
						if (match)
						{
							switch (summary.pattern)
							{
								case '0':
								case '1':
								case '2':
								case '3':
								case '4':
									if (tablecode)
									{
										for (var i3=0;i3<match[tablecode].value.length;i3++)
											amount+=parseFloat(match[tablecode].value[i3].value[summary.field].value);
									}
									else
									{
										if (match[summary.field].value)
											amount+=parseFloat(match[summary.field].value);
									}
									switch (summary.pattern)
									{
										case '3':
											totalamount+=amount;
											break;
										case '4':
											counter++;
											break;
									}
									break;
								case '5':
								case '6':
								case '7':
									amount++;
									break;
							}
						}
						switch (summary.pattern)
						{
							case '1':
								if (tablecode)
								{
									for (var i3=0;i3<filter[i2][tablecode].value.length;i3++)
										monthlyamount+=parseFloat(filter[i2][tablecode].value[i3].value[summary.field].value);
								}
								else
								{
									if (filter[i2][summary.field].value)
										monthlyamount+=parseFloat(filter[i2][summary.field].value);
								}
								break;
							case '6':
								monthlyamount++;
								break;
						}
					}
					return res;
				})($.grep(records,function(item,index){
					return (new Date(item[vars.config.date].value)>=fromdate && new Date(item[vars.config.date].value)<=todate);
				}));
				switch (summary.pattern)
				{
					case '0':
						$('td',row).eq(i).text(amount.comma());
						if (unitposition=='BEFORE') $('td',row).eq(i).text(unit+$('td',row).eq(i).text());
						else $('td',row).eq(i).text($('td',row).eq(i).text()+unit);
						break;
					case '1':
						if (monthlyamount!=0) $('td',row).eq(i).text(functions.rounding(amount/monthlyamount).comma()+'%');
						else $('td',row).eq(i).text('0%');
						break;
					case '2':
						if (totalamount!=0) $('td',row).eq(i).text(functions.rounding(amount/totalamount).comma()+'%');
						else $('td',row).eq(i).text('0%');
						break;
					case '3':
						$('td',row).eq(i).text(totalamount.comma());
						if (unitposition=='BEFORE') $('td',row).eq(i).text(unit+$('td',row).eq(i).text());
						else $('td',row).eq(i).text($('td',row).eq(i).text()+unit);
						break;
					case '4':
						if (counter!=0) $('td',row).eq(i).text(functions.rounding(amount/counter).comma());
						else $('td',row).eq(i).text('0');
						if (unitposition=='BEFORE') $('td',row).eq(i).text(unit+$('td',row).eq(i).text());
						else $('td',row).eq(i).text($('td',row).eq(i).text()+unit);
						break;
					case '5':
						$('td',row).eq(i).text(amount.comma()+'件');
						break;
					case '6':
						if (monthlyamount!=0) $('td',row).eq(i).text(functions.rounding(amount/monthlyamount).comma()+'%');
						else $('td',row).eq(i).text('0%');
						break;
					case '7':
						if (totalamount!=0) $('td',row).eq(i).text(functions.rounding(amount/totalamount).comma()+'%');
						else $('td',row).eq(i).text('0%');
						break;
				}
			}
		},
		/* reload view */
		load:function(){
			vars.splash.removeClass('hide');
			vars.offset=0;
			functions.loaddatas(records,function(records){
				for (var i=0;i<vars.summaries.length;i++) functions.summary($('tr',vars.table.contents).eq(i),records,vars.summaries[i]);
				vars.splash.addClass('hide');
			});
		},
		/* load app datas */
		loaddatas:function(records,callback){
			var fromdate=new Date((vars.year.toString()+'-'+vars.config.basemonth+'-1').dateformat());
			var todate=fromdate.calc('12 month').calc('-1 day');
			var body={
				app:kintone.app.getId(),
				query:kintone.app.getQueryCondition()
			};
			body.query+=((body.query)?' and ':'')+vars.config.date+'>='+fromdate.format('Y-m-d')+' and '+vars.config.date+'<='+todate.format('Y-m-d');
			body.query+=' limit '+vars.limit.toString();
			body.query+=' offset '+vars.offset.toString();
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				Array.prototype.push.apply(records,resp.records);
				vars.offset+=vars.limit;
				if (resp.records.length==vars.limit) functions.loaddatas(records,callback);
				else callback(records);
			},function(error){
				vars.splash.addClass('hide');
				swal('Error!',error.message,'error');
			});
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
		if ('views' in vars.config) vars.views=JSON.parse(vars.config.views);
		/* check viewid */
		if (!('_'+event.viewId.toString() in vars.views)) return event;
		/* get views of app */
		kintone.api(kintone.api.url('/k/v1/app/views',true),'GET',{app:kintone.app.getId()},function(resp){
			$.each(resp.views,function(key,values){
				if (values.type.toUpperCase()=='LIST' && values.id==event.viewId)
				{
					var setupyear=function(amount){
						vars.year+=amount;
						$('.monthlysummary-headermenucontents #year').text(vars.year.toString());
						/* reload view */
						functions.load();
					};
					/* initialize valiable */
					vars.summaries=vars.views['_'+event.viewId.toString()];
					vars.splash=$('<div id="splash">').append(
						$('<p>')
						.append($('<span>').text('now loading'))
						.append($('<span class="dot progress1">').text('.'))
						.append($('<span class="dot progress2">').text('.'))
						.append($('<span class="dot progress3">').text('.'))
						.append($('<span class="dot progress4">').text('.'))
						.append($('<span class="dot progress5">').text('.'))
					);
					/* append elements */
					if ($('.monthlysummary-headermenucontents').size()) $('.monthlysummary-headermenucontents').remove();
					kintone.app.getHeaderMenuSpaceElement().appendChild(
						$('<div class="monthlysummary-headermenucontents">')
						.append($('<button class="customview-button prev-button">').on('click',function(){setupyear(-1)}))
						.append($('<span id="year" class="customview-span">'))
						.append($('<button class="customview-button next-button">').on('click',function(){setupyear(1)}))
						[0]
					);
					$('body').append(vars.splash);
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
					/* setup year value */
					setupyear(0);
					/* get fields of app */
					kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
						vars.fieldinfos=$.fieldparallelize(resp.properties);
						/* create table */
						var basemonth=new Date((vars.year.toString()+'-'+vars.config.basemonth+'-1').dateformat());
						var head=$('<tr>');
						var template=$('<tr>');
						head.append($('<th>'));
						template.append($('<td>'));
						for (var i=0;i<12;i++)
						{
							head.append($('<th>').text(basemonth.calc(i.toString()+' month').format('m')+'月'));
							template.append($('<td>'));
						}
						vars.table=$('<table id="monthlysummary" class="customview-table">').mergetable({
							container:$('div#view-list-data-gaia').empty(),
							head:head,
							template:template,
							merge:false
						});
						/* insert row */
						for (var i=0;i<vars.summaries.length;i++)
						{
							var summary=vars.summaries[i];
							vars.table.insertrow(null,function(row){
								$('td',row).first(summary.caption).css({'text-align':'left'});
								$('td',row).each(function(index){
									$(this).css({
										'background-color':'#'+summary.backcolor,
										'color':'#'+summary.forecolor,
										'text-align':'right'
									});
								});
							});
						}
						/* reload view */
						functions.load();
					},function(error){swal('Error!',error.message,'error');});
				}
			})
		},function(error){swal('Error!',error.message,'error');});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
