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
	$(function(){
		var bulksendmax=1000;
		var limit=100;
		var bulklooplimit=bulksendmax/limit+1;
		var loaded=false;
		function tocomma(value){
			return String(value).replace(/(\d)(?=(\d{3})+$)/g,"$1,")
		}
		var terms={
			en:{
				failed_to_get_template:"Failed to retrieve kintone app to be used as a template.",
				create_mail:"  Compose E-mail  ",
				dialog_content:"Open Mailwise.",
				dialog_caution:"If multiple e-mail addresses are entered in the To field,<br>only the first e-mail address will be used as the recipient address.",
				dialog_ok:"OK",
				dialog_cancel:"Cancel",
				date:"Date and Time",
				title:"Title",
				type:"Type",
				prev:"Previous",
				next:"Next",
				no_records:"No history to show.",
				over_max_target_num:"The number of records to be sent in bulk exceeds the limit of "+tocomma(bulksendmax)+".",
				no_to_field:"Cannot show the history. Check the To field setting.",
				category_not_supported:"The Mailwise Connector plug-in does not support filtering by category.",
				test_environment:"Cannot compose e-mail with the Mailwise Connector plug-in on a test environment."
			},
			ja:{
				failed_to_get_template:"テンプレートとして使用するアプリの取得に失敗しました。",
				create_mail:" メールを作成する ",
				dialog_content:"メールワイズの画面を開きます。",
				dialog_caution:"1件のレコードに複数のメールアドレスが登録されている場合、先頭のメールアドレスにのみ送信されます。",
				dialog_ok:"OK",
				dialog_cancel:"キャンセル",
				date:"日時",
				title:"件名",
				type:"種別",
				prev:"前へ",
				next:"次へ",
				no_records:"表示する履歴がありません。",
				over_max_target_num:"対象レコードが一斉配信の上限"+tocomma(bulksendmax)+"件を超えました。",
				no_to_field:"履歴を表示できません。「To」に使用するフィールドの設定を確認してください。",
				category_not_supported:"メールワイズ連携プラグインは、カテゴリーを使った絞り込みには対応していません。",
				test_environment:"メールワイズ連携プラグインは、動作テスト環境ではメールを作成できません。"
			}
		};
		var config;
		var userlang=kintone.getLoginUser().language;
		var userterms=(userlang in terms)?terms[userlang]:terms.en;
		var uiversion=kintone.getUiVersion()===2?"us":"jp";
		function dialog(){
			this.width={
				jp:630,
				us:738
			};
			this.height={
				jp:119,
				us:167
			};
			this.okButtonCallback;
			this.$container;
			this.template={
				jp:'<div class="dialog-bg-cybozu" style="width: {{:width}}; height: {{:height}}; opacity: 0.3;"></div><div class="dialog-cybozu" style="left: {{:left}}; top: {{:top}}; transform: none; -webkit-transform: none; opacity: 1;" tabindex="0">  <div class="dialog-box-cybozu">    <div class="dialog-contents-cybozu">{{>terms.dialog_content}}<br>{{:terms.dialog_caution}}</div>  </div>  <div class="dialog-close-cybozu">    <button id="mailwisePlugin-dialog-ok" class="button-normal-cybozu dialog-ok-button-cybozu" type="button">{{>terms.dialog_ok}}</button>    <button id="mailwisePlugin-dialog-cancel"class="button-normal-cybozu dialog-close-button-cybozu" type="button">{{>terms.dialog_cancel}}</button>  </div></div>',
				us:'<div class="ocean-ui-dialog-bg ocean-ui-dialog-bg-transition" aria-hidden="true" style="filter: alpha(opacity=60); opacity: 0.6; width: {{:width}}; height: {{:height}};"></div><div class="ocean-ui-dialog ocean-ui-dialog-transition" tabindex="0" role="dialog" aria-labelledby=":1t" style="left: {{:left}}; top: {{:top}};">  <div class="ocean-ui-dialog-content" style="padding: 10px 20px;">{{>terms.dialog_content}}<br>{{:terms.dialog_caution}}</div>  <div class="ocean-ui-dialog-buttons gaia-argoui-dialog-buttons gaia-argoui-dialog-buttons-general">    <div class="gaia-argoui-dialog-buttons-left">      <button id="mailwisePlugin-dialog-cancel"  name="cancel" type="button" class="gaia-argoui-dialog-buttons-normal" style="-webkit-user-select: none;">{{>terms.dialog_cancel}}</button>    </div>    <div class="gaia-argoui-dialog-buttons-right">      <button id="mailwisePlugin-dialog-ok"  name="ok" type="button" class="gaia-argoui-dialog-buttons-default" style="-webkit-user-select: none;">{{>terms.dialog_ok}}</button>    </div>  </div></div>'
			}
		}
		dialog.prototype.init=function(){
			var container=$("<div></div>").hide();
			$("body").append(container);
			this.$container=container;
			var V="100%";
			var height=document.body.scrollHeight>window.innerHeight?document.body.scrollHeight+"px":"100%";
			var left=($(window).width()-this.width[uiversion])/2;
			var top=($(window).height()-this.height[uiversion])/2;
			var template=$.templates(this.template[uiversion]);
			container.html(template.render({width:V,height:height,left:left+"px",top:top+"px",terms:userterms}));
			var my=this;
			$("#mailwisePlugin-dialog-ok").click(function(){
				container.hide();
				my.okButtonCallback&&my.okButtonCallback()
			});
			$("#mailwisePlugin-dialog-cancel").click(function(){container.hide()})
		};
		dialog.prototype.show=function(){
			this.$container.show()
		};
		function isguest(){
			return kintone.getLoginUser()?kintone.getLoginUser().isGuest:true
		}
		var getconfig=function(record){
			try{config=kintone.plugin.app.getConfig(PLUGIN_ID)}
			catch(T){return false}
			if(!config){
				return false
			}
			var S=config.templateapp;
			var X=config.templatename;
			var W=config.templatesubject;
			var Y=config.templatebody;
			if(S.length!=0){
				if(!S||!X||!W||!Y){
					console.log("required field is empty");
					return false
				}
			}
			return true
		};
		function issinglelinefield(type){
			return(type=="SINGLE_LINE_TEXT"||type=="RADIO_BUTTON"||type=="DROP_DOWN"||type=="NUMBER"||type=="LINK")
		}
		var assign=function(target,record){
			var end=0;
			while(true){
				var start=target.indexOf("%",end);
				if(start<0){
					break
				}
				end=target.indexOf("%",start+1);
				if(end<0){
					break
				}
				var span=end-start-1;
				var fieldcode=target.substr(start+1,span);
				if(span>0&&record[fieldcode]){
					var field=record[fieldcode];
					if(issinglelinefield(field.type)){
						target=target.substr(0,start)+record[fieldcode].value+target.substr(end+1);
						end=start+record[fieldcode].value.length;
						continue
					}
				}
				end++
			}
			return target
		};
		var assignhtml=function(target,record){
			var dummy=$("<div>");
			dummy.html(target);
			assignhtml_inner(dummy.get(0),record);
			return dummy.html()
		};
		var assignhtml_inner=function(target,record){
			if(target.nodeType==3){
				target.nodeValue=assign(target.nodeValue,record)
			}
			else{
				for(var i=0,limit=target.childNodes.length;i<limit;i++){
					assignhtml_inner(target.childNodes[i],record)
				}
			}
		};
		var getstylesheet=function(target,property){
			return target.currentStyle?target.currentStyle[property]:document.defaultView.getComputedStyle(target,null).getPropertyValue(property)
		};
		var htmltotext=function(value){
			var dummy=$("<div>");
			dummy.html(value);
			return htmltotext_inner(dummy.get(0))
		};
		var htmltotext_inner=function(target){
			var res="";
			if(target.nodeType==3){
				res=target.nodeValue.replace(/\s+/g," ")
			}
			else{
				for(var i=0,limit=target.childNodes.length;i<limit;i++){
					res+=htmltotext_inner(target.childNodes[i])
				}
				var displaystyle=getstylesheet(target,"display");
				if(displaystyle.match(/^block/)||displaystyle.match(/list/)||displaystyle.match(/row/)||target.tagName=="BR"||target.tagName=="HR"){
					res+="\n"
				}
			}
			return res
		};
		function dateformat(value,type){
			var format=(function(value){
				var reg=/^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})Z$/;
				var res=reg.exec(value);
				var success=(res.length===7)?true:false;
				return{
					success:success,
					original:res[0],
					year:success?res[1]:"",
					month:success?res[2]:"",
					day:success?res[3]:"",
					hour:success?res[4]:"",
					min:success?res[5]:"",
					sec:success?res[6]:""
				}
			});
			var lpad=function(value){
				return("0"+value).slice(-2)
			};
			var formatvalue=format(value);
			var formated=formatvalue.original;
			if(formatvalue.success){
				var date=new Date();
				date.setUTCFullYear(formatvalue.year,formatvalue.month-1,formatvalue.day);
				date.setUTCHours(formatvalue.hour,formatvalue.min,formatvalue.sec);
				var checkdate=new Date();
				if(date.getFullYear()!=checkdate.getFullYear()){
					formated=date.getFullYear()+"/"+lpad(date.getMonth()+1)+"/"+lpad(date.getDate())
				}
				else{
					formated=lpad(date.getMonth()+1)+"/"+lpad(date.getDate())
				}
				if(type==="datetime"){
					formated+=" "+lpad(date.getHours())+":"+lpad(date.getMinutes())
				}
			}
			return formated
		}
		var templatevalues;
		var appendformparts=function(space){
			var button=$('<button id="mailwisePlugin-creating-mail-button" class="button-simple-cybozu mailwisePlugin-create-mail" type="button"></button>');
			var list;
			if(config.templateapp.length!=0){
				button.hide();
				list=$('<select id="mailwisePlugin-template-dropdown" class="mailwisePlugin-template-app-id" id="mailwisePlugin-template-app-id"><option value="">--</option></select>');
				var appid=config.templateapp;
				kintone.api(kintone.api.url("/k/v1/records",true),"GET",{app:appid},function(resp){
					templatevalues=[];
					if(resp.records.length>0){
						list.empty()
					}
					for(var i=0;i<resp.records.length;i++){
						var record=resp.records[i];
						var templatevalue={
							name:"",
							subject:"",
							body:"",
							html:false
						};
						record[config.templatename]&&(templatevalue.name=record[config.templatename].value);
						record[config.templatesubject]&&(templatevalue.subject=record[config.templatesubject].value);
						if(record[config.templatebody]){
							var bodyfield=record[config.templatebody];
							templatevalue.body=bodyfield.value;
							if(bodyfield.type=="RICH_TEXT"){
								templatevalue.html=true
							}
						}
						list.append($("<OPTION>").text(templatevalue.name).val(i));
						templatevalues.push(templatevalue)
					}
					button.show()
				},
				function(){
					space.empty();
					var errormessage=$('<span class="mailwisePlugin-errorMessage"></span>');
					errormessage.text(userterms.failed_to_get_template);
					space.append(errormessage)
				})
			}
			button.text(userterms.create_mail);
			return{
				"$select":list,
				"$button":button
			}
		};
		var mailformtemplate='<form method="POST" target="_blank" action="/m/mw.cgi">  <input type="hidden" name="Page" value="MailSend">  <input type="hidden" name="MailTo" value="1">  <input type="hidden" name="To" value="{{>mailto}}">  <input type="hidden" name="CC" value="{{>mailcc}}">  <input type="hidden" name="BCC" value="{{>mailbcc}}">  <input type="hidden" name="Subject">  <input type="hidden" name="Data">  <input type="hidden" name="HtmlData"></form>';
		var createmailform=function(event){
			var headspace=$(kintone.app.record.getHeaderMenuSpaceElement());
			var mailspace=$('<div class="mailwisePlugin-headerMenu"></div>');
			headspace.append(mailspace);
			var renderparam={
				mailto:event.record[config.mailto]?event.record[config.mailto].value:"",
				mailcc:event.record[config.mailcc]?event.record[config.mailcc].value:"",
				mailbcc:event.record[config.mailbcc]?event.record[config.mailbcc].value:""
			};
			var template=$.templates(mailformtemplate);
			var mailform=$(template.render(renderparam));
			mailspace.append(mailform);
			var formparts=appendformparts(mailspace);
			mailform.append(formparts.$select);
			mailform.append(formparts.$button);
			var record=$.extend(true,{},event.record);
			formparts.$button.click(function(){
				if(/^\/k\/(guest\/\d+\/)*admin\/preview\//.test(window.location.pathname)){
					alert(userterms.test_environment);
					return
				}
				if(templatevalues){
					var templateindex=formparts.$select.val();
					if(templateindex==""){
						return
					}
					var templatekey=Number(templateindex);
					if(templatevalues.length<=templatekey){
						return
					}
					var templatevalue=templatevalues[templatekey];
					var subject=assign(templatevalue.subject,record);
					var body=templatevalue.body;
					$("[name=Subject]",mailform).val(subject);
					if(templatevalue.html){
						body=assignhtml(body,record);
						$("[name=HtmlData]",mailform).val(body);
						$("[name=Data]",mailform).val(htmltotext(body))
					}
					else{
						body=assign(body,record);
						$("[name=Data]",mailform).val(body)
					}
				}
				mailform.submit()
			})
		};
		var bulkmailformtemplate='<form method="POST" target="_blank" action="/m/mw.cgi">  <input type="hidden" name="Page" value="PostConfirm">  <input type="hidden" name="MailTo" value="1">  <input type="hidden" name="Subject">  <input type="hidden" name="Data">  <input type="hidden" name="HtmlData">  <input type="hidden" name="Targets"></form>';
		var mailspinner;
		var createbulkmailform=function(event){
			var headspace=$(kintone.app.getHeaderMenuSpaceElement());
			var mailspace=$('<div class="mailwisePlugin-headerMenu"></div>');
			headspace.append(mailspace);
			var mailform=$(bulkmailformtemplate);
			mailspace.append(mailform);
			var confirmdialog=new dialog();
			confirmdialog.okButtonCallback=function(){
				mailform.submit()
			};
			confirmdialog.init();
			var formparts=appendformparts(mailspace);
			mailform.append(formparts.$select);
			mailform.append(formparts.$button);
			var spinnerelements=$('<div id="mailwisePlugin-spinner" style="display: inline-block"></div>');
			mailform.append(spinnerelements);
			var spinnerstyle={
				lines:11,
				length:4,
				width:2,
				radius:4,
				corners:1,
				rotate:0,
				direction:1,
				color:"#000",
				speed:1,
				trail:60,
				shadow:false,
				hwaccel:false,
				className:"spinner",
				zIndex:2000000000,
				top:"-3px",
				left:"10px",
				position:"relative"
			};
			formparts.$button.click(function(){
				if(/^\/k\/(guest\/\d+\/)*admin\/preview\//.test(window.location.pathname)){
					alert(userterms.test_environment);
					return
				}
				if(/[#&]category=/.test(window.location.hash)){
					alert(userterms.category_not_supported);
					return
				}
				if(templatevalues){
					var templateindex=formparts.$select.val();
					if(templateindex==""){
						return
					}
					var templatekey=Number(templateindex);
					if(templatevalues.length<=templatekey){
						return
					}
					var templatevalue=templatevalues[templatekey];
					$("[name=Subject]",mailform).val(templatevalue.subject);
					if(templatevalue.html){
						$("[name=HtmlData]",mailform).val(templatevalue.body);
						$("[name=Data]",mailform).val(htmltotext(templatevalue.body))
					}
					else{
						$("[name=Data]",mailform).val(templatevalue.body)
					}
				}
				if(typeof formparts.$select!=="undefined"){
					formparts.$select.prop("disabled",true)
				}
				formparts.$button.prop("disabled",true);
				mailspinner=new spinner(spinnerstyle).spin(spinnerelements[0]);
				var rendervalues=[];
				var counter=0;
				var subject=(templatevalues)?templatevalue.subject:"";
				var body=(templatevalues)?templatevalue.body:"";
				getrenderfields(subject,body,function(fields){
					getrendervalues(rendervalues,fields,kintone.app.getQueryCondition(),0,function(){
						$("[name=Targets]",mailform).val(JSON.stringify(rendervalues));
						confirmdialog.show();
						loadend()
					},counter)
				})
			})
		};
		function getrenderfields(subject,body,callback){
			var template=subject+body;
			if(template.length===0){
				callback([]);
				return
			}
			var body={
				app:kintone.app.getId(),
				lang:"default"
			};
			kintone.api(kintone.api.url("/k/v1/app/form/fields",true),"GET",body,function(resp){
				var res=[];
				$.each(resp.properties,function(){
					if(template.indexOf("%"+this.code+"%")!==-1){
						res.push(this.code)
					}
				});
				callback(res)
			})
		}
		function loadend(){
			$("#mailwisePlugin-creating-mail-button").prop("disabled",false);
			$("#mailwisePlugin-template-dropdown").prop("disabled",false);
			mailspinner&&mailspinner.stop()
		}
		function getrendervalues(rendervalues,renderfields,query,offset,callback,counter){
			counter++;
			if(counter>bulklooplimit){
				loadend();
				var headspace=$(kintone.app.getHeaderSpaceElement());
				var messagespace=$('<div class="mailwisePlugin-'+uiversion+'-alert"></div>');
				headspace.empty();
				headspace.append(messagespace);
				messagespace.text(userterms.over_max_target_num);
				return
			}
			var body={
				app:kintone.app.getId(),
				query:query+" limit "+limit+" offset "+offset
			};
			kintone.api(kintone.api.url("/k/v1/records",true),"GET",body,function(resp){
				if(typeof resp.records!=="undefined"){
					if(resp.records.length==0){
						if(rendervalues.length>0){
							callback()
						}
						else{
							loadend()
						}
					}
					else{
						for(var i=0;i<resp.records.length;i++){
							var rendervalue={};
							var record=resp.records[i];
							if(typeof record[config.mailto]!=="undefined"&&(record[config.mailto].type==="SINGLE_LINE_TEXT"||record[config.mailto].type==="LINK")){
								var mail=record[config.mailto].value;
								if(mail&&mail.indexOf(",")!==-1){
									mail=mail.substring(0,mail.indexOf(","))
								}
								rendervalue.Address=mail
							}
							else{
								console.log("no required field.");
								loadend();
								return
							}
							if(typeof record.Customer!=="undefined"&&record.Customer.type==="SINGLE_LINE_TEXT"){
								rendervalue.Customer=record.Customer.value
							}
							if(typeof record.Company!=="undefined"&&record.Company.type==="SINGLE_LINE_TEXT"){
								rendervalue.Company=record.Company.value
							}
							if(typeof record.Section!=="undefined"&&record.Section.type==="SINGLE_LINE_TEXT"){
								rendervalue.Section=record.Section.value
							}
							$.each(renderfields,function(){
								if(typeof rendervalue[this]!=="undefined"){
									return
								}
								if(typeof record[this]!=="undefined"&&issinglelinefield(record[this].type)){
									rendervalue[this]=(record[this].value)?record[this].value:""
								}
							});
							rendervalues.push(rendervalue)
						}
						if(rendervalues.length<=bulksendmax){
							getrendervalues(rendervalues,renderfields,query,rendervalues.length,callback,counter)
						}
						else{
							loadend();
							var headspace=$(kintone.app.getHeaderSpaceElement());
							var messagespace=$('<div class="mailwisePlugin-'+uiversion+'-alert"></div>');
							headspace.empty();
							headspace.append(messagespace);
							messagespace.text(userterms.over_max_target_num)
						}
					}
				}
				else{
					loadend()
				}
			},
			function(logdata){
				loadend();
				console.log(logdata)
			})
		}
		var setupmailform=function(event){
			if(!getconfig(event.record)){
				return event
			}
			if(config.normal=="false"){
				return false
			}
			createmailform(event);
			return event
		};
		var setupbulkmailform=function(event){
			if(isguest()){
				return event
			}
			if(!getconfig(event.record)){
				return event
			}
			if(config.bulk!=="true"){
				return false
			}
			createbulkmailform(event);
			loaded=true;
			return event
		};
		function createurl(urlparts){
			var url=urlparts||"";
			return kintone.api.url("/m/mw.cgi"+url).replace(/\.json$/,"")
		}
		var requestmanager={
			request_:function(urlparts,body,success,fail){
				var url=createurl("/v1/"+urlparts);
				kintone.api(url,"POST",body,success,fail)
			},
			baseSpaceList:function(success,fail){
				this.request_("base/space/list",{},success,fail)
			},
			addressHistoryList:function(spaceid,mail,offset,success,fail){
				var body={
					spaceId:spaceid,
					id:0,
					mail:mail,
					limit:20
				};
				offset&&(body.pos=offset);
				this.request_("address/history/list",body,success,fail)
			}
		};
		var mailhistoryspacetemplate='<div id="mailwisePlugin-history" class="mailwisePlugin-history {{:uiVersion}}">  <table class="subtable-gaia reference-subtable-gaia mailwisePlugin-history-table">    <thead class="subtable-header-gaia">      <tr>        <th class="subtable-label-gaia mailwisePlugin-header-date">          <span>{{>terms.date}}</span>        </th>        <th class="subtable-label-gaia mailwisePlugin-header-title">          <span>{{>terms.title}}</span>        </th>        <th class="subtable-label-gaia mailwisePlugin-header-type">          <span>{{>terms.type}}</span>        </th>      </tr>    </thead>    <tbody id="mailwisePlugin-history-tbody">    </tbody>  </table>  <div id="mailwisePlugin-pager" class="pager-gaia mailwisePlugin-pager" style="display:none;">    <a href="javascript:void(0)" id="mailwisePlugin-prev" class="pager-prev-gaia pager-disable" itemprop="prev">{{>terms.prev}}</a>    <a href="javascript:void(0)" id="mailwisePlugin-next" class="pager-next-gaia pager-disable" itemprop="next">{{>terms.next}}</a>  </div>  <div id="mailwisePlugin-history-table-spinner" style="display: inline-block"></div></div>';
		var mailhistorytemplate='<tbody id="mailwisePlugin-history-tbody">  {{for rows}}  <tr>    <td>      <div class="control-gaia control-horizon-gaia control-show-gaia">        <div class="control-value-gaia">          <span class="control-value-content-gaia mailwisePlugin-date">{{>date}}</span>        </div>        <div class="control-design-gaia"></div>     </div>    </td>    <td>      <div class="control-gaia control-horizon-gaia control-show-gaia">        <div class="control-value-gaia">          <span class="control-value-content-gaia mailwisePlugin-subject"><a href="{{>url}}" target="_blank"><img src="{{>icon}}">{{>title}}</a></span>        </div>        <div class="control-design-gaia"></div>     </div>    </td>    <td>      <div class="control-gaia control-horizon-gaia control-show-gaia">        <div class="control-value-gaia">          <span class="control-value-content-gaia mailwisePlugin-type">{{>type}}</span>        </div>        <div class="control-design-gaia"></div>     </div>    </td>  </tr>  {{/for}}</tbody>';
		var mailhistoryerrortemplate='<tbody id="mailwisePlugin-history-tbody">  <tr>    <td colspan="3">      <div class="control-gaia control-horizon-gaia control-show-gaia">        <div class="control-value-gaia">          <span class="control-value-content-gaia mailwisePlugin-message">{{>message}}</span>        </div>        <div class="control-design-gaia"></div>     </div>    </td>  </tr></tbody>';
		function historymanager(space,spaceid,mail){
			this.$spaceField_=space;
			this.mailSpaceId_=spaceid;
			this.mailAddress_=mail;
			this.$history_;
			this.tbodyTemplate_=$.templates(mailhistorytemplate);
			this.tbodyMessageTemplate_=$.templates(mailhistoryerrortemplate);
			this.$pager_;
			this.$prev_;
			this.$next_;
			this.prevOffset_;
			this.nextOffset_;
			this.$spinnerEl_;
			this.spinner_
		}
		historymanager.prototype.getStaticUrl_=function(urlparts){
			var url=window.location.protocol+"//";
			var host=window.location.host.replace(/^.+?\./,"static.");
			url+=host+"/contents/k/plugin/mailwise/v2/"+urlparts;
			return url
		};
		historymanager.prototype.startLoading_=function(){
			this.$prev_.addClass("pager-disable");
			this.$next_.addClass("pager-disable");
			var spinnerstyle={
				lines:11,
				length:4,
				width:2,
				radius:4,
				corners:1,
				rotate:0,
				direction:1,
				color:"#000",
				speed:1,
				trail:60,
				shadow:false,
				hwaccel:false,
				className:"spinner",
				zIndex:2000000000,
				top:"-"+this.$history_.height()/2+"px",
				left:this.$history_.width()/2+"px",
				position:"relative"
			};
			this.spinner_=new spinner(spinnerstyle).spin(this.$spinnerEl_[0])
		};
		historymanager.prototype.stopLoading_=function(prev,next){
			if(prev){
				this.$prev_.removeClass("pager-disable")
			}
			else{
				this.$prev_.addClass("pager-disable")
			}
			if(next){
				this.$next_.removeClass("pager-disable")
			}
			else{
				this.$next_.addClass("pager-disable")
			}
			if(prev||next){
				this.$pager_.show()
			}
			else{
				this.$pager_.hide()
			}
			this.spinner_.stop()
		};
		historymanager.prototype.createTable_=function(offset){
			var enableprev=this.$prev_.hasClass("pager-dispable");
			var enablenext=this.$next_.hasClass("pager-dispable");
			this.startLoading_();
			var my=this;
			requestmanager.addressHistoryList(this.mailSpaceId_,this.mailAddress_,offset,function(resp){
				if(resp.success){
					var historyvalues=[];
					for(var i=0;i<resp.rows.length;i++){
						var historyvalue={
							date:dateformat(resp.rows[i].date,resp.rows[i].dateType),
							title:resp.rows[i].title,
							type:resp.rows[i].appName
						};
						var queryparam=[];
						switch(resp.rows[i].type){
							case"mail":
								switch(resp.rows[i].mailType){
									case"received":
										historyvalue.icon=my.getStaticUrl_("mail20.png");
										break;
									case"sent":
										historyvalue.icon=my.getStaticUrl_("mail_sent20.png");
										break;
									case"draft":
										historyvalue.icon=my.getStaticUrl_("mail_write20.png");
										break
								}
								queryparam.page="MailView";
								queryparam.wid=my.mailSpaceId_;
								queryparam.bs=resp.rows[i].appId;
								queryparam.mid=resp.rows[i].id;
								break;
							case"visitHistory":
								historyvalue.icon=my.getStaticUrl_("contact20.png");
								queryparam.page="FormDocView";
								queryparam.wid=my.mailSpaceId_;
								queryparam.bs=resp.rows[i].appId;
								queryparam.rid=resp.rows[i].id;
								break;
							case"phoneHistory":
								historyvalue.icon=my.getStaticUrl_("tel20.png");
								queryparam.page="FormDocView";
								queryparam.wid=my.mailSpaceId_;
								queryparam.bs=resp.rows[i].appId;
								queryparam.rid=resp.rows[i].id;
								break;
							case"bulksend":
								historyvalue.icon=my.getStaticUrl_("postmail20.png");
								queryparam.page="PostView";
								queryparam.wid=my.mailSpaceId_;
								queryparam.pcid=resp.rows[i].id;
								break
						}
						var query=[];
						for(var key in queryparam){
							query.push(key+"="+queryparam[key])
						}
						historyvalue.url=createurl("?"+query.join("&"));
						historyvalues.push(historyvalue)
					}
					if(historyvalues.length>0){
						$("#mailwisePlugin-history-tbody").replaceWith(my.tbodyTemplate_.render({terms:userterms,rows:historyvalues}))
					}
					else{
						$("#mailwisePlugin-history-tbody").replaceWith(my.tbodyMessageTemplate_.render({message:userterms.no_records}))
					}
					my.prevOffset_=resp.prev;
					my.nextOffset_=resp.next;
					my.stopLoading_(resp.prev?true:false,resp.next?true:false)
				}
				else{
					my.stopLoading_(enableprev,enablenext);
					appenderror($spaceField,resp.code+": "+resp.message)
				}
			})
		};
		historymanager.prototype.head=function(){
			this.createTable_(null)
		};
		historymanager.prototype.page=function(offset){
			this.createTable_(offset)
		};
		historymanager.prototype.init=function(){
			var template=$.templates(mailhistoryspacetemplate);
			this.$spaceField_.append(template.render({uiVersion:uiversion,terms:userterms}));
			this.$history_=$("#mailwisePlugin-history");
			this.$pager_=$("#mailwisePlugin-pager");
			this.$prev_=$("#mailwisePlugin-prev");
			this.$next_=$("#mailwisePlugin-next");
			this.$spinnerEl_=$("#mailwisePlugin-history-table-spinner");
			var my=this;
			this.$prev_.click(function(){
				if($(this).hasClass("pager-disable")){
					return
				}
				my.page(my.prevOffset_)
			});
			this.$next_.click(function(){
				if($(this).hasClass("pager-disable")){
					return
				}
				my.page(my.nextOffset_)
			});
			this.head()
		};
		function setupmailhistory(event){
			if(config.historyspace){
				var historyspace=$(kintone.app.record.getSpaceElement(config.historyspace));
				historyspace.closest(".layout-gaia").css({width:"auto"});
				historyspace.closest(".control-etc-gaia").css({
					width:"auto",
					height:"auto"
				});
				historyspace.closest(".control-group-gaia").css({width:"auto"});
				if(typeof event.record[config.mailto]==="undefined"){
					appenderror(historyspace,userterms.no_to_field)
				}
				requestmanager.baseSpaceList(function(resp){
					if(resp.success){
						var spaceid=resp.defaultId;
						var mail=event.record[config.mailto].value;
						var history=new historymanager(historyspace,spaceid,mail);
						history.init()
					}
					else{
						appenderror(historyspace,resp.code+": "+resp.message)
					}
				})
			}
		}
		function appenderror(space,message){
			var template=$.templates('<div class="mailwisePlugin-'+uiversion+'-alert">{{>message}}</div>');
			space.append(template.render({message:message}))
		}
		kintone.events.on("app.record.detail.show",function(event){
			if(isguest()){
				return event
			}
			setupmailform(event);
			setupmailhistory(event)
		});
		kintone.events.on("app.record.index.show",function(event){
			if(loaded||event.viewType!=="list"){
				return event
			}
			else{
				return setupbulkmailform(event)
			}
		})
	})
})(jQuery,kintone.$PLUGIN_ID,Spinner);