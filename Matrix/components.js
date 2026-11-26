app.component('typed-js', {
   props: ['strings', 'speed'],
   template: '<div class="typed-element" ref="typedElement"><slot></slot></div>',
   data() {
      return {
         typedObj: null,
      }
   },
   methods: {
      initTypedJS: function () {
         const $typed = this.$refs.typedElement.querySelector('.typing');
         this.typedObj = new Typed($typed, {contentType: 'html', strings: this.strings, loop: false, typeSpeed: this.speed});
      },
   },
   setup(props, context) {
      console.log('Setup.');
   },
   mounted() {
      console.log('Mounted.');
      this.initTypedJS();
   },
   destroyed() {
      this.typedObj.destroy();
   },
   beforeUpdate () {
      this.typedObj.typeSpeed = this.speed;

      if(JSON.stringify(this.typedObj.strings) !== JSON.stringify(this.strings)){
         this.typedObj.strings = this.strings;
         this.typedObj.reset(true);
      }
   },
});