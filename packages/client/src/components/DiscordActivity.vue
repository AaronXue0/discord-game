<template>
  <div class="game">
    <h2>{{ currentQuestion.question }}</h2>
    <ul>
      <li v-for="(answer, index) in currentQuestion.answers" :key="index" @click="selectAnswer(index)">
        {{ answer }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import {defineComponent, ref, computed} from 'vue';

export default defineComponent({
  name: 'GameTrivia',
  setup() {
    const questions = ref([
      {
        question: 'What is the capital of France?',
        answers: ['Paris', 'London', 'Berlin', 'Madrid'],
        correctAnswer: 0,
      },
      {
        question: 'Which planet is known as the Red Planet?',
        answers: ['Earth', 'Mars', 'Jupiter', 'Venus'],
        correctAnswer: 1,
      },
      // Add more questions as needed
    ]);

    const currentQuestionIndex = ref(0);

    const selectAnswer = (index: number) => {
      if (index === questions.value[currentQuestionIndex.value].correctAnswer) {
        alert('Correct!');
      } else {
        alert('Incorrect! Try again.');
      }
      // Move to the next question or end game
      currentQuestionIndex.value = (currentQuestionIndex.value + 1) % questions.value.length;
    };

    return {
      currentQuestion: computed(() => questions.value[currentQuestionIndex.value]),
      selectAnswer,
    };
  },
});
</script>

<style scoped>
.game {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  margin: 5px 0;
  cursor: pointer;
}
</style>
