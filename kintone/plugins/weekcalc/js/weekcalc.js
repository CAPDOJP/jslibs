/*
*--------------------------------------------------------------------
* jQuery-Plugin "weekcalc"
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
		calculations:[],
		config:{},
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
	var functions={
		weekcalc:function(record,calculation){
			if (record[calculation.date].value)
			{
				var date=new Date(record[calculation.date].value.dateformat());
				var week=[
					'日曜日',
					'月曜日',
					'火曜日',
					'水曜日',
					'木曜日',
					'金曜日',
					'土曜日'
				];
				switch (vars.fieldinfos[calculation.week].type)
				{
					case 'DROP_DOWN':
					case 'RADIO_BUTTON':
						record[calculation.week].value=calculation.weekoption[date.getDay()];
						break;
					case 'SINGLE_LINE_TEXT':
						record[calculation.week].value=week[date.getDay()];
						break;
				}
			}
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
		},
		/* loaded datas update */
		loadedupdate:function(record){
			var update=kintone.app.record.get();
			for (var i=0;i<vars.calculations.length;i++)
			{
				var calculation=vars.calculations[i];
				var tablecode=vars.fieldinfos[calculation.date].tablecode;
				if (tablecode)
				{
					for (var i2=0;i2<record[tablecode].value.length;i2++)
						update.record[tablecode].value[i2].value[calculation.week].value=record[tablecode].value[i2].value[calculation.week].value;
				}
				else update.record[calculation.week].value=record[calculation.week].value;
			}
			kintone.app.record.set(update);
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		if (!('calculation' in vars.config)) return event;
		else
		{
			if (vars.config['bulk']!='1') return event;
		}
		/* initialize valiable */
		vars.calculations=JSON.parse(vars.config['calculation']);
		/* get fields of app */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.fieldinfos=$.fieldparallelize(resp.properties);
			/* clear elements */
			if ($('.custom-elements-weekcalc').size()) $('.custom-elements-weekcalc').remove();
			/* append elements */
			kintone.app.getHeaderMenuSpaceElement().appendChild(
				$('<button type="button" class="kintoneplugin-button-dialog-ok custom-elements-weekcalc">')
				.text('曜日一括計算')
				.on('click',function(e){
					swal({
						title:'確認',
						text:'表示中の一覧の条件に該当するすべてのレコードの曜日を再計算します。宜しいですか？',
						type:'info',
						showCancelButton:true,
						cancelButtonText:'Cancel'
					},
					function(){
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
									for (var i2=0;i2<vars.calculations.length;i2++)
									{
										var calculation=vars.calculations[i2];
										var tablecode=vars.fieldinfos[calculation.date].tablecode;
										if (tablecode)
										{
											for (var i3=0;i3<record[tablecode].value.length;i3++)
												functions.weekcalc(record[tablecode].value[i3].value,calculation);
										}
										else functions.weekcalc(record,calculation);
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
					});
				})[0]
			);
		},function(error){
			swal('Error!',error.message,'error');
		});
		vars.progress=$('<div id="progress">').append($('<div class="message">')).append($('<div class="progressbar">').append($('<div class="progresscell">')));
		$('body').append(vars.progress);
		return event;
	});
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		if (!('calculation' in vars.config)) return event;
		/* initialize valiable */
		vars.calculations=JSON.parse(vars.config['calculation']);
		/* get fields of app */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.fieldinfos=$.fieldparallelize(resp.properties);
			var counter=vars.calculations.length;
			var record=kintone.app.record.get();
			for (var i=0;i<vars.calculations.length;i++)
				(function(calculation,record){
					var events=[];
					var tablecode=vars.fieldinfos[calculation.date].tablecode;
					if (tablecode)
					{
						counter+=record[tablecode].value.length-1;
						for (var i2=0;i2<record[tablecode].value.length;i2++)
						{
							functions.weekcalc(record[tablecode].value[i2].value,calculation);
							counter--;
							if (counter==0) functions.loadedupdate(record);
						}
						events=[];
						events.push('app.record.create.change.'+tablecode);
						events.push('app.record.edit.change.'+tablecode);
						(function(events){
							kintone.events.on(events,function(event){
								if (event.changes.row) functions.weekcalc(event.changes.row.value,calculation);
								return event;
							});
						})(events)
					}
					else
					{
						functions.weekcalc(record,calculation);
						counter--;
						if (counter==0) functions.loadedupdate(record);
					}
					events=[];
					events.push('app.record.create.change.'+calculation.date);
					events.push('app.record.edit.change.'+calculation.date);
					events.push('app.record.index.edit.change.'+calculation.date);
					kintone.events.on(events,function(event){
						var record=(tablecode)?event.changes.row.value:event.record;
						functions.weekcalc(record,calculation);
						return event;
					});
				})(vars.calculations[i],record.record);
		},function(error){
			swal('Error!',error.message,'error');
		});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
