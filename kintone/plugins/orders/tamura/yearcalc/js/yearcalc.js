/*
*--------------------------------------------------------------------
* jQuery-Plugin "yearcalc"
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
		limit:500,
		offset:0,
		progress:null,
		records:[],
		dates:[],
		config:{},
		fieldinfos:{}
	};
	var events={
		lists:[
			'app.record.index.show'
		]
	};
	var functions={
		yearcalc:function(year){
			vars.offset=0;
			vars.records=[];
			vars.progress.find('.message').text('一覧データ取得中');
			vars.progress.find('.progressbar').find('.progresscell').width(0);
			vars.progress.show();
			functions.loaddatas(function(){
				var error=false;
				var counter=0;
				var progress=function(){
					counter++;
					if (counter<vars.records.length)
					{
						vars.progress.find('.progressbar').find('.progresscell').width(vars.progress.find('.progressbar').innerWidth()*(counter/vars.records.length));
					}
					else
					{
						vars.progress.hide();
						swal({
							title:'更新完了',
							text:'データを更新しました。',
							type:'success'
						},function(){location.reload(true);});
					}
				};
				if (vars.records.length==0)
				{
					vars.progress.hide();
					setTimeout(function(){
						swal('Error!','レコードがありません。','error');
					},500);
					return;
				}
				else vars.progress.find('.message').text('データ登録中');
				for (var i=0;i<vars.records.length;i++)
				{
					if (error) break;
					var record={};
					var body={
						app:kintone.app.getId(),
						id:vars.records[i]['$id'].value,
						record:{}
					};
					$.each(vars.records[i],function(key,values){
						switch (values.type)
						{
							case 'CALC':
							case 'CATEGORY':
							case 'CREATED_TIME':
							case 'CREATOR':
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
					(function(record,body){
						for (var i2=0;i2<vars.dates.length;i2++)
						{
							var date=vars.dates[i2];
							var tablecode=vars.fieldinfos[date].tablecode;
							if (tablecode)
							{
								for (var i3=0;i3<record[tablecode].value.length;i3++)
									if (record[tablecode].value[i2].value[date].value)
										record[tablecode].value[i2].value[date].value=new Date(record[tablecode].value[i2].value[date].value).calc(year.toString()+' year').format('Y-m-d');
							}
							else
							{
								if (record[date].value)
									record[date].value=new Date(record[date].value).calc(year.toString()+' year').format('Y-m-d');
							}
						}
						body.record=record;
						kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
							progress();
						},function(error){
							vars.progress.hide();
							swal('Error!',error.message,'error');
							error=true;
						});
					})(record,body);
				}
			});
		},
		/* load app datas */
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
			},function(error){
				vars.progress.hide();
				swal('Error!',error.message,'error');
			});
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		if (!('dates' in vars.config)) return event;
		/* initialize valiable */
		vars.dates=JSON.parse(vars.config['dates']);
		/* get fields of app */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.fieldinfos=$.fieldparallelize(resp.properties);
			/* clear elements */
			if ($('.custom-elements-yearcalc').size()) $('.custom-elements-yearcalc').remove();
			/* append elements */
			kintone.app.getHeaderMenuSpaceElement().appendChild(
				$('<button type="button" class="kintoneplugin-button-dialog-ok custom-elements-yearcalc">')
				.text('年度繰り上げ')
				.on('click',function(e){
					swal({
						title:'確認',
						text:'表示中の一覧の条件に該当するすべてのレコードの日付を1年繰り上げます。宜しいですか？',
						type:'info',
						showCancelButton:true,
						cancelButtonText:'Cancel'
					},
					function(){functions.yearcalc(1);});
				})[0]
			);
			kintone.app.getHeaderMenuSpaceElement().appendChild(
				$('<button type="button" class="kintoneplugin-button-dialog-ok custom-elements-yearcalc">')
				.text('年度繰り下げ')
				.on('click',function(e){
					swal({
						title:'確認',
						text:'表示中の一覧の条件に該当するすべてのレコードの日付を1年繰り下げます。宜しいですか？',
						type:'info',
						showCancelButton:true,
						cancelButtonText:'Cancel'
					},
					function(){functions.yearcalc(-1);});
				})[0]
			);
		},function(error){
			swal('Error!',error.message,'error');
		});
		vars.progress=$('<div id="progress">').append($('<div class="message">')).append($('<div class="progressbar">').append($('<div class="progresscell">')));
		$('body').append(vars.progress);
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
