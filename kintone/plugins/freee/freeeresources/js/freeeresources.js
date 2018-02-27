/*
*--------------------------------------------------------------------
* jQuery-Plugin "freeeresources"
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
		accesstoken:'',
		limit:500,
		offset:0,
		progress:null,
		config:{},
		counter:{param:0,progress:{}},
		records:{}
	};
	var events={
		lists:[
			'app.record.index.show'
		]
	};
	var functions={
		/* register */
		downloadfreee:function(params,callback){
			vars.progress.find('.message').text(params[vars.counter.param].caption+'データダウンロード中');
			vars.progress.find('.progressbar').find('.progresscell').width(0);
			vars.progress.show();
			kintone.proxy(
				'https://api.freee.co.jp/api/1/'+params[vars.counter.param].request+'?company_id='+$('select.companies').val(),
				'GET',
				{
					'Authorization':'Bearer '+vars.accesstoken
				},
				{},
				function(body,status,headers){
					if (status==200)
					{
						var downloads=JSON.parse(body)[params[vars.counter.param].key];
						var values=[];
						vars.offset=0;
						vars.records[params[vars.counter.param].key]=[];
						for (var i=0;i<downloads.length;i++)
						{
							var value={};
							$.each(params[vars.counter.param].fields,function(key,values){
								if (params[vars.counter.param].key=='account_items')
									if (key=='default_tax_code')
										if (downloads[i][key].toString()=='0') downloads[i][key]=null
								value[values]={value:downloads[i][key]};
							});
							values.push(value);
						}
						functions.loaddatas(params[vars.counter.param].app,params[vars.counter.param].key,function(){
							vars.progress.find('.message').text(params[vars.counter.param].caption+'データ登録中');
							var error=false;
							vars.counter.progress[params[vars.counter.param].key]=0;
							if (values.length==0)
							{
								vars.counter.param++;
								if (vars.counter.param<params.length) functions.downloadfreee(params,callback);
								else callback();
							}
							else
							{
								for (var i=0;i<values.length;i++)
								{
									if (error) return;
									(function(record,appkey,key,indexes,total,callback){
										var filter=$.grep(vars.records[key],function(item,index){
											return item[indexes].value==record[indexes].value;
										});
										var body={};
										var method='';
										if (filter.length!=0)
										{
											$.each(filter[0],function(key,values){
												if (values.type=='SUBTABLE') record[key]={value:values.value};
											});
											method='PUT';
											body={
												app:appkey,
												id:filter[0]['$id'].value,
												record:record
											};
										}
										else
										{
											method='POST';
											body={
												app:appkey,
												record:record
											};
										}
										kintone.api(kintone.api.url('/k/v1/record',true),method,body,function(resp){
											vars.counter.progress[key]++;
											if (vars.counter.progress[key]<total)
											{
												vars.progress.find('.progressbar').find('.progresscell').width(vars.progress.find('.progressbar').innerWidth()*(vars.counter.progress[key]/total));
											}
											else callback();
										},function(error){
											vars.progress.hide();
											swal('Error!',error.message,'error');
											error=true;
										});
									})(values[i],params[vars.counter.param].app,params[vars.counter.param].key,params[vars.counter.param].indexes,values.length,function(){
										vars.counter.param++;
										if (vars.counter.param<params.length) functions.downloadfreee(params,callback);
										else callback();
									});
								}
							}
						});
					}
					else
					{
						vars.progress.hide();
						swal('Error!',params[vars.counter.param].caption+'データのダウンロードに失敗しました。','error');
					}
				},
				function(error){
					vars.progress.hide();
					swal('Error!',error.message,'error');
				}
			);
		},
		/* get companies */
		getcompanies:function(type){
			kintone.proxy(
				'https://api.freee.co.jp/api/1/companies',
				'GET',
				{
					'Authorization':'Bearer '+vars.accesstoken
				},
				{},
				function(body,status,headers){
					if (status==200)
					{
						var json=JSON.parse(body);
						var companies=$('<div class="kintoneplugin-select-outer">').append($('<div class="kintoneplugin-select">').append($('<select class="companies">')));
						var download=$('<button type="button" class="kintoneplugin-button-dialog-ok">');
						/* setup elements */
						$('select',companies).append($('<option>').attr('value','').html('&nbsp;事業所選択&nbsp;'));
						for (var i=0;i<json.companies.length;i++)
						{
							var company=json.companies[i];
							$('select',companies).append($('<option>').attr('value',company.id).html('&nbsp;'+company.display_name+'&nbsp;'));
						}
						download.text('Freeeデータダウンロード').on('click',function(e){
							if ($('select.companies').val().length==0)
							{
								swal('Error!','事業所を選択して下さい。','error');
								return;
							}
							swal({
								title:'確認',
								text:'Freeeから各種データをダウンロードします。宜しいですか？。',
								type:'info',
								showCancelButton:true,
								cancelButtonText:'Cancel'
							},
							function(){
								var fields={};
								var params=[];
								vars.counter.param=0;
								vars.counter.progress={};
								if (vars.config['taxapp'].length!=0)
								{
									fields=JSON.parse(vars.config['taxfields']);
									params.push({
										caption:'税区分',
										app:vars.config['taxapp'],
										fields:fields,
										indexes:fields['code'],
										key:'taxes',
										request:'taxes/codes'
									});
								}
								if (vars.config['accountapp'].length!=0)
								{
									fields=JSON.parse(vars.config['accountfields']);
									params.push({
										caption:'勘定科目',
										app:vars.config['accountapp'],
										fields:fields,
										indexes:fields['id'],
										key:'account_items',
										request:'account_items'
									});
								}
								if (vars.config['itemapp'].length!=0)
								{
									fields=JSON.parse(vars.config['itemfields']);
									params.push({
										caption:'品目',
										app:vars.config['itemapp'],
										fields:fields,
										indexes:fields['id'],
										key:'items',
										request:'items'
									});
								}
								if (vars.config['partnerapp'].length!=0)
								{
									fields=JSON.parse(vars.config['partnerfields']);
									params.push({
										caption:'取引先',
										app:vars.config['partnerapp'],
										fields:fields,
										indexes:fields['id'],
										key:'partners',
										request:'partners'
									});
								}
								if (vars.config['sectionapp'].length!=0)
								{
									fields=JSON.parse(vars.config['sectionfields']);
									params.push({
										caption:'部門',
										app:vars.config['sectionapp'],
										fields:fields,
										indexes:fields['id'],
										key:'sections',
										request:'sections'
									});
								}
								if (vars.config['walletableapp'].length!=0)
								{
									fields=JSON.parse(vars.config['walletablefields']);
									params.push({
										caption:'口座',
										app:vars.config['walletableapp'],
										fields:fields,
										indexes:fields['id'],
										key:'walletables',
										request:'walletables'
									});
								}
								functions.downloadfreee(params,function(){
									vars.progress.hide();
									swal('登録完了','登録完了しました。','success');
								});
							});
						});
						/* clear elements */
						if ($('.custom-elements').size()) $('.custom-elements').remove();
						/* append elements */
						kintone.app.getHeaderMenuSpaceElement().appendChild(companies.addClass('custom-elements')[0]);
						kintone.app.getHeaderMenuSpaceElement().appendChild(download.addClass('custom-elements')[0]);
					}
					else
					{
						swal('Error!','事業所一覧データの取得に失敗しました。','error');
					}
				},
				function(error){
					swal('Error!',error.message,'error');
				}
			);
		},
		/* get token */
		gettoken:function(callback){
			/* get access token */
			var regex=new RegExp("access_token=([^&#]*)");
			var results=regex.exec(window.location.href);
			if (results!=null)
			{
				vars.accesstoken=decodeURIComponent(results[1].replace(/\+/g," "));
				callback();
			}
			else
			{
				/* redirect authorize url */
				var authurl='https://secure.freee.co.jp/oauth/authorize?response_type=token';
				authurl+='&client_id='+vars.config['freeeappid'];
				authurl+='&redirect_uri='+encodeURI(decodeURI(window.location.href));
				window.location.href=authurl;
			}
		},
		/* load app datas */
		loaddatas:function(appkey,key,callback){
			var sort='';
			var body={
				app:appkey,
				query:''
			};
			sort=' order by $id asc limit '+vars.limit.toString()+' offset '+vars.offset.toString();
			body.query+=sort;
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				Array.prototype.push.apply(vars.records[key],resp.records);
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
		vars.progress=$('<div id="progress">').append($('<div class="message">')).append($('<div class="progressbar">').append($('<div class="progresscell">')));
		$('body').append(vars.progress);
		functions.gettoken(function(){
			functions.getcompanies();
		});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
