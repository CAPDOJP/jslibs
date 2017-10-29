/*
*--------------------------------------------------------------------
* jQuery-Plugin "mailwise"
* Version: 1.0
* Copyright (c) 2017 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID,spinner){
	"use strict";
	/*---------------------------------------------------------------
	 valiable
	---------------------------------------------------------------*/
	var vars={
		history:{
			next:{
				button:null,
				offset:0
			},
			prev:{
				button:null,
				offset:0
			},
			spaceid:null,
			table:null,
		},
		limit:500,
		loaded:false,
		apps:{},
		config:{},
		fields:{},
		offset:{}
	};
	var events={
		lists:[
			'app.record.index.show'
		],
		show:[
			'app.record.detail.show'
		]
	};
	var functions={
		appendformelements:function(target,buttonaction){
			var button=$('<button type="button">').addClass('mailwise-button').on('click',function(){if (typeof buttonaction!=='undefined') buttonaction();});
			if (vars.config.templateapp.length!=0)
			{
				var templatelist=$('<select id="templatelist">').addClass('mailwise-select');
				var segmentlist=$('<select id="segmentlist">').addClass('mailwise-select');
				if (vars.config.templatesegment.length!=0)
				{
					kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:vars.config.templateapp},function(resp){
						var key=vars.config.templatesegment;
						if (key in resp.properties)
						{
							var options=[resp.properties[key].options.length];
							$.each(resp.properties[key].options,function(key,values){
								options[values.index]=values.label;
							});
							for (var i=0;i<options.length;i++) segmentlist.append($('<option>').text(options[i]).val(options[i]));
						}
						segmentlist.on('change',function(){
							/* load template datas */
							vars.apps[vars.config.templateapp]=null;
							vars.offset[vars.config.templateapp]=0;
							templatelist.empty();
							functions.loaddatas(vars.config.templateapp,key+' in ("'+segmentlist.val()+'")',function(){
								for(var i=0;i<vars.apps[vars.config.templateapp].length;i++)
								{
									var record=vars.apps[vars.config.templateapp][i];
									templatelist.append($('<option>').text(record[vars.config.templatename].value).val(record['$id'].value));
								}
							});
						}).trigger('change');
					});
					target.append(segmentlist);
					target.append(templatelist);
					target.append(button);
				}
				else
				{
					/* load template datas */
					vars.apps[vars.config.templateapp]=null;
					vars.offset[vars.config.templateapp]=0;
					templatelist.empty();
					functions.loaddatas(vars.config.templateapp,'',function(){
						for(var i=0;i<vars.apps[vars.config.templateapp].length;i++)
						{
							var record=vars.apps[vars.config.templateapp][i];
							templatelist.append($('<option>').text(record[vars.config.templatename].value).val(record['$id'].value));
						}
						target.append(templatelist);
						target.append(button);
					});
				}
			}
			else target.append(button);
		},
		assign:function(target,record){
			for (var key in record) target=target.replace(new RegExp('%'+key+'%','g'),record[key].value);
			return target;
		},
		assignhtml:function(target,record){
			if(target.nodeType==3) target.nodeValue=functions.assign(target.nodeValue,record);
			else for(var i=0;i<target.childNodes.length;i++) functions.assignhtml(target.childNodes[i],record);
		},
		dateformat:function(value,type){
			var format=(function(value){
				var reg=/^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})Z$/;
				var res=reg.exec(value);
				var success=(res.length===7)?true:false;
				return {
					success:success,
					original:res[0],
					year:success?res[1]:"",
					month:success?res[2]:"",
					day:success?res[3]:"",
					hour:success?res[4]:"",
					min:success?res[5]:"",
					sec:success?res[6]:""
				};
			});
			var lpad=function(value){return("0"+value).slice(-2)};
			var formatvalue=format(value);
			var formated=formatvalue.original;
			if (formatvalue.success)
			{
				var date=new Date();
				date.setUTCFullYear(formatvalue.year,formatvalue.month-1,formatvalue.day);
				date.setUTCHours(formatvalue.hour,formatvalue.min,formatvalue.sec);
				var checkdate=new Date();
				if(date.getFullYear()!=checkdate.getFullYear()) formated=date.getFullYear()+"/"+lpad(date.getMonth()+1)+"/"+lpad(date.getDate())
				else formated=lpad(date.getMonth()+1)+"/"+lpad(date.getDate())
				if (type==="datetime") formated+=" "+lpad(date.getHours())+":"+lpad(date.getMinutes())
			}
			return formated;
		},
		field:function(key,record){
			if (key.length==0) return {type:'',value:''};
			if (!(key in record)) return {type:'',value:''};
			return  {type:record[key].type,value:record[key].value};
		},
		htmltotext:function(target){
			var display='';
			var res='';
			if(target.nodeType==3) res=target.nodeValue.replace(/\s+/g,' ');
			else
			{
				for(var i=0;i<target.childNodes.length;i++) res+=functions.htmltotext(target.childNodes[i]);
				var display=target.currentStyle?target.currentStyle['display']:document.defaultView.getComputedStyle(target,null).getPropertyValue('display');
				if(display.match(/^block/)||display.match(/list/)||display.match(/row/)||target.tagName=='BR'||target.tagName=='HR') res+='\n';
			}
			return res;
		},
		loaddatas:function(appkey,condition,callback){
			var query=(condition.length!=0)?condition+' ':'';
			query+='limit '+vars.limit.toString()+' offset '+vars.offset[appkey].toString();
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',{app:appkey,query:query},function(resp){
				if (vars.apps[appkey]==null) vars.apps[appkey]=resp.records;
				else Array.prototype.push.apply(vars.apps[appkey],resp.records);
				vars.offset[appkey]+=vars.limit;
				if (resp.records.length==vars.limit) functions.loaddatas(appkey,condition,callback);
				else
				{
					if (callback!=null) callback();
				}
			},function(error){});
		},
		loadhistories:function(offset,callback){
			var body={
				id:0,
				limit:20,
				mail:$('#maillist').val(),
				pos:offset,
				spaceId:vars.history.spaceid
			};
			kintone.api(kintone.api.url('/m/mw.cgi/v1/address/history/list').replace(/\.json$/,""),'POST',body,function(resp){
				if(resp.success)
				{
					var row=null;
					var url=window.location.protocol+'//';
					url+=window.location.host.replace(/^.+?\./,'static.');
					url+='/contents/k/plugin/mailwise/v2/';
					/* clear rows */
					vars.history.table.rows.remove();
					for(var i=0;i<resp.rows.length;i++)
					{
						var icon=$('<img>');
						var subject=$('<span>');
						var query=[];
						var queryparam=[];
						switch (resp.rows[i].type)
						{
							case 'mail':
								switch (resp.rows[i].mailType)
								{
									case 'received':
										icon.attr('src',url+'mail20.png');
										break;
									case 'sent':
										icon.attr('src',url+'mail_sent20.png');
										break;
									case 'draft':
										icon.attr('src',url+'mail_write20.png');
										break
								}
								queryparam.page='MailView';
								queryparam.wid=vars.history.spaceid;
								queryparam.bs=resp.rows[i].appId;
								queryparam.mid=resp.rows[i].id;
								break;
							case 'visitHistory':
								icon.attr('src',url+'contact20.png');
								queryparam.page='FormDocView';
								queryparam.wid=vars.history.spaceid;
								queryparam.bs=resp.rows[i].appId;
								queryparam.rid=resp.rows[i].id;
								break;
							case 'phoneHistory':
								icon.attr('src',url+'tel20.png');
								queryparam.page='FormDocView';
								queryparam.wid=vars.history.spaceid;
								queryparam.bs=resp.rows[i].appId;
								queryparam.rid=resp.rows[i].id;
								break;
							case 'bulksend':
								icon.attr('src',url+'postmail20.png');
								queryparam.page='PostView';
								queryparam.wid=vars.history.spaceid;
								queryparam.pcid=resp.rows[i].id;
								break
						}
						for(var key in queryparam) query.push(key+'='+queryparam[key]);
						vars.history.table.addrow();
						row=vars.history.table.rows.last();
						row.find('td').eq(0).find('span').text(functions.dateformat(resp.rows[i].date,resp.rows[i].dateType));
						row.find('td').eq(1).find('span').append(
							$('<a>')
							.attr('href',kintone.api.url('/m/mw.cgi?'+query.join('&')))
							.attr('target','_blank')
							.append(icon)
							.append(subject.text(resp.rows[i].title))
						);
						row.find('td').eq(2).find('span').text(resp.rows[i].appName);
					}
					vars.history.prev.offset=resp.prev;
					vars.history.next.offset=resp.next;
					if (!resp.prev) vars.history.prev.button.hide();
					else vars.history.prev.button.show();
					if (!resp.next) vars.history.next.button.hide();
					else vars.history.next.button.show();
					if (callback!=null) callback(resp.rows);
				}
				else swal('Error!',resp.code+': '+resp.message,'error');
			});
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		/* chack login */
		if (!kintone.getLoginUser()) return event;
		if (kintone.getLoginUser().isGuest) return event;
		/* check config */
		if(vars.config.bulk=='0') return event;
		/* check view type */
		if (event.viewType.toUpperCase()!='LIST') return event;
		/* check loaded */
		if(vars.loaded) return event;
		/* get fields of app */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.fields=resp.properties;
			/* create form */
			var headspace=$(kintone.app.getHeaderMenuSpaceElement());
			var mailform=$('<form>').attr('action','/m/mw.cgi').attr('method','POST').attr('target','_blank');
			mailform.append($('<input type="hidden" name="Page">').val('PostConfirm'));
			mailform.append($('<input type="hidden" name="MailTo">').val('1'));
			mailform.append($('<input type="hidden" name="Subject">').val(''));
			mailform.append($('<input type="hidden" name="Data">').val(''));
			mailform.append($('<input type="hidden" name="HtmlData">').val(''));
			mailform.append($('<input type="hidden" name="Targets">').val(''));
			headspace.append($('<div>').addClass('mailwise-container').append(mailform));
			headspace.children('div').css({'display':'inline-block'});
			functions.appendformelements(mailform,function(){
				/* load app datas */
				vars.apps[kintone.app.getId()]=null;
				vars.offset[kintone.app.getId()]=0;
				functions.loaddatas(kintone.app.getId(),kintone.app.getQueryCondition(),function(){
					var keys=[];
					var targets=[];
					if (vars.config.templateapp.length!=0)
					{
						var filter=$.grep(vars.apps[vars.config.templateapp],function(item,index){
							return item['$id'].value==mailform.find('select#templatelist').val();
						});
						if (filter.length!=0)
						{
							var subject=functions.field(vars.config.templatesubject,filter[0]);
							var body=functions.field(vars.config.templatebody,filter[0]);
							if (subject.value.length) $('[name=Subject]',mailform).val(subject.value);
							if (body.value.length)
							{
								if (body.type=='RICH_TEXT')
								{
									$('[name=HtmlData]',mailform).val(body.value);
									$('[name=Data]',mailform).val(functions.htmltotext($('<div>').html(body.value).get(0)));
								}
								else $('[name=Data]',mailform).val(body.value);
							}
							$.each(vars.fields,function(key,values){
								switch (values.type)
								{
									case 'DROP_DOWN':
									case 'LINK':
									case 'NUMBER':
									case 'RADIO_BUTTON':
									case 'SINGLE_LINE_TEXT':
										if((subject.value+body.value).indexOf('%'+values.code+'%')!==-1) keys.push(values.code);
										break;
								}
							});
						}
					}
					for(var i=0;i<vars.apps[kintone.app.getId()].length;i++)
					{
						var record=vars.apps[kintone.app.getId()][i];
						targets.push({});
						if (vars.config.mailto in record) targets[targets.length-1].Address=record[vars.config.mailto].value;
						$.each(keys,function(index){
							if (keys[index] in record) targets[targets.length-1][keys[index]]=record[keys[index]].value;
						});
					}
					$('[name=Targets]',mailform).val(JSON.stringify(targets));
					swal({
						title:'確認',
						text:'メールワイズの画面を開きます。',
						type:'info',
						showCancelButton:true,
						cancelButtonText:'Cancel'
					},
					function(){
						mailform.submit();
					});
				});
			});
		});
		vars.loaded=true;
		return event;
	});
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		/* chack login */
		if (!kintone.getLoginUser()) return event;
		if (kintone.getLoginUser().isGuest) return event;
		/* check config */
		if(vars.config.normal=='0') return event;
		/* get fields of app */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.fields=resp.properties;
			/* create form */
			var headspace=$(kintone.app.record.getHeaderMenuSpaceElement());
			var mailform=$('<form>').attr('action','/m/mw.cgi').attr('method','POST').attr('target','_blank');
			mailform.append($('<input type="hidden" name="Page">').val('MailSend'));
			mailform.append($('<input type="hidden" name="MailTo">').val('1'));
			mailform.append($('<input type="hidden" name="To">').val(functions.field(vars.config.mailto,event.record).value));
			mailform.append($('<input type="hidden" name="CC">').val(functions.field(vars.config.mailcc,event.record).value));
			mailform.append($('<input type="hidden" name="BCC">').val(functions.field(vars.config.mailbcc,event.record).value));
			mailform.append($('<input type="hidden" name="Subject">').val(''));
			mailform.append($('<input type="hidden" name="Data">').val(''));
			mailform.append($('<input type="hidden" name="HtmlData">').val(''));
			headspace.append($('<div>').addClass('mailwise-container').append(mailform).css({'margin':'8px 16px 0px 16px'}));
			headspace.children('div').css({'display':'inline-block'});
			functions.appendformelements(mailform,function(){
				if (vars.config.templateapp.length!=0)
				{
					var filter=$.grep(vars.apps[vars.config.templateapp],function(item,index){
						return item['$id'].value==$('#templatelist',mailform).val();
					});
					if (filter.length!=0)
					{
						var subject=functions.field(vars.config.templatesubject,filter[0]);
						var body=functions.field(vars.config.templatebody,filter[0]);
						if (subject.value.length) $('[name=Subject]',mailform).val(functions.assign(subject.value,event.record));
						if (body.value.length)
						{
							if (body.type=='RICH_TEXT')
							{
								body=$('<div>').html(body.value);
								functions.assignhtml(body.get(0),event.record);
								$('[name=HtmlData]',mailform).val(body.html());
								$('[name=Data]',mailform).val(functions.htmltotext(body.get(0)));
							}
							else $('[name=Data]',mailform).val(functions.assign(body.value,event.record));
						}
						mailform.submit();
					}
				}
				else mailform.submit();
			});
			/* create history */
			if(vars.config.historyspace)
			{
				var mails=vars.config.historymails.split(',');;
				var historymail=$('<select id="maillist">').addClass('mailwise-select').css({'display':'block'});
				var historyerror=$('<span>').text('表示する履歴がありません。');
				var historyspace=$(kintone.app.record.getSpaceElement(vars.config.historyspace));
				var historytable=$('<table>').addClass('subtable-gaia').addClass('mailwise-history');
				historytable.append($('<thead>').addClass('subtable-header-gaia')
					.append($('<tr>')
						.append($('<th>').addClass('subtable-label-gaia').append($('<span>').text('日時')))
						.append($('<th>').addClass('subtable-label-gaia').append($('<span>').text('件名')))
						.append($('<th>').addClass('subtable-label-gaia').append($('<span>').text('種別')))
					)
				);
				historytable.append($('<tbody>')
					.append($('<tr>')
						.append($('<td>').append($('<span>')))
						.append($('<td>').append($('<span>')))
						.append($('<td>').append($('<span>')))
					)
				);
				vars.history.table=historytable.adjustabletable({});
				vars.history.next.button=$('<a href="javascript:void(0)">').addClass('pager-next-gaia').addClass('mailwise-feed').text('次へ').on('click',function(){
					functions.loadhistories(vars.history.next.offset);
				});
				vars.history.prev.button=$('<a href="javascript:void(0)">').addClass('pager-prev-gaia').addClass('pager-next-gaia,mailwise-feed').text('前へ').on('click',function(){
					functions.loadhistories(vars.history.prev.offset);
				});
				historyspace.append(historymail);
				historyspace.append(historyerror);
				historyspace.append(vars.history.table.container);
				historyspace.append(vars.history.prev.button);
				historyspace.append(vars.history.next.button);
				historyspace.closest('.layout-gaia').css({'max-width':'100%','padding':'0px','width':'auto'});
				historyspace.closest('.control-etc-gaia').css({
					'height':'auto',
					'min-height':'0px',
					'min-width':'0px',
					'padding':'0px 8px',
					'width':'100%'
				});
				if (vars.config.mailto in event.record)
					historymail.append($('<option>').text(vars.fields[vars.config.mailto].label).val(event.record[vars.config.mailto].value));
				for (var i=0;i<mails.length;i++)
					if (mails[i] in event.record)
						if (event.record[mails[i]].value.length!=0)
							historymail.append($('<option>').text(vars.fields[mails[i]].label).val(event.record[mails[i]].value));
				/* get mailwise space */
				kintone.api(kintone.api.url('/m/mw.cgi/v1/base/space/list').replace(/\.json$/,""),'POST',{},function(resp){
					if(resp.success)
					{
						vars.history.spaceid=resp.defaultId;
						historymail.on('change',function(){
							functions.loadhistories(0,function(histories){
								if (histories.length==0)
								{
									vars.history.next.button.hide();
									vars.history.prev.button.hide();
									vars.history.table.container.hide();
									historyerror.show();
								}
								else
								{
									vars.history.table.container.show();
									historyerror.hide();
								}
							});
						}).trigger('change');
					}
					else swal('Error!',resp.code+': '+resp.message,'error');
				});
			}
		});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID,Spinner);