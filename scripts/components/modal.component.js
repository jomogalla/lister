var mapState = Vuex.mapState;

Vue.component('modal', {
    props: {
        message: {
            type: String,
            required: true,
        },
        acceptMessage: {
            type: String,
            default: 'Yes',
        },
        declineMessage: {
            type: String,
            default: 'No',
        }
    },
    data() {
        return {
            modalOpen: false,
        };
    },
	methods: {
        open() {
            this.modalOpen = true;
        },
        close() {
            this.modalOpen = false;
        },
        accept() {
            this.$emit('accepted');
            this.close();
        },
        decline() {
            this.$emit('declined');
            this.close();
        },
	},
	template: '#modal-template',
}); 